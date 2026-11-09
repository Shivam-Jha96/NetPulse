/**
 * NetPulse Native CDP Test Driver
 * Drives native `src-tauri/target/release/netpulse.exe` via Chrome DevTools Protocol
 * over native Node.js WebSocket and HTTP fetch.
 */

import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export class CdpDriver {
  constructor(options = {}) {
    this.port = options.port || 9222;
    this.binPath = options.binPath || path.join(projectRoot, 'src-tauri/target/release/netpulse.exe');
    this.process = null;
    this.ws = null;
    this.targetId = null;
    this.wsUrl = null;
    this.msgId = 0;
    this.pending = new Map();
    this.eventListeners = new Map();
    this.consoleLogs = [];
    this.isConnected = false;
  }

  /**
   * Cleanup any lingering netpulse.exe processes
   */
  static killExistingProcesses(port = 9222) {
    try {
      if (process.platform === 'win32') {
        execSync('taskkill /F /IM netpulse.exe /T 2>nul', { stdio: 'ignore' });
        try {
          const netstat = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
          const pids = netstat.split('\n')
            .map((line) => line.trim().split(/\s+/).pop())
            .filter((pid) => pid && /^\d+$/.test(pid) && pid !== '0');
          for (const pid of new Set(pids)) {
            try { execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' }); } catch {}
          }
        } catch {}
      }
    } catch {
      // Ignored if no process running
    }
  }

  /**
   * Start the native application and establish CDP WebSocket connection
   */
  async start(options = {}) {
    const timeoutMs = options.timeoutMs || 30000;
    const startTime = Date.now();

    // Kill any existing instances first to ensure clean state on port 9222
    CdpDriver.killExistingProcesses(this.port);
    await new Promise((r) => setTimeout(r, 1000));

    // Spawn native binary with WebView2 CDP debugging flag
    const env = {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${this.port}`,
    };

    console.log(`[CDP Driver] Launching: ${this.binPath}`);
    this.process = spawn(this.binPath, [], {
      cwd: projectRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    this.process.stdout.on('data', (d) => {
      // Stream process output for diagnostics
    });

    this.process.stderr.on('data', (d) => {
      console.error(`[Native stderr] ${d.toString()}`);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`[CDP Driver] Process exited with code ${code}, signal ${signal}`);
      this.isConnected = false;
    });

    // Poll http://127.0.0.1:9222/json/list until target page is available
    let target = null;
    const pollInterval = 500;
    while (Date.now() - startTime < timeoutMs) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          const list = await res.json();
          // Find real page target (not intermediate about:blank)
          target = list.find((t) => t.title && !t.title.includes('about:blank') && (t.title?.includes('NetPulse') || t.url?.includes('localhost')) && t.webSocketDebuggerUrl);
          if (target && target.webSocketDebuggerUrl) {
            break;
          }
        }
      } catch {
        // WebView2 still spinning up
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    if (!target || !target.webSocketDebuggerUrl) {
      await this.stop();
      throw new Error(`Failed to discover CDP target on port ${this.port} within ${timeoutMs}ms`);
    }

    this.targetId = target.id;
    this.wsUrl = target.webSocketDebuggerUrl;
    console.log(`[CDP Driver] Discovered target ${target.id} (${target.title || target.url})`);
    console.log(`[CDP Driver] Connecting to WebSocket: ${this.wsUrl}`);

    // Connect native Node.js WebSocket
    await this.connectWebSocket(this.wsUrl);

    // Enable essential CDP domains
    await this.send('Runtime.enable');
    await this.send('Page.enable');
    await this.send('DOM.enable');

    // Wait until document ready state is complete and header is mounted
    await this.waitForFunction(() => document.readyState === 'complete', 15000);
    await this.waitForSelector('header', 15000);

    // Short stabilization pause to allow React hydration
    await new Promise((r) => setTimeout(r, 1000));
    console.log(`[CDP Driver] Native desktop application initialized & ready.`);
  }

  /**
   * Internal WebSocket connection handler
   */
  connectWebSocket(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.addEventListener('open', () => {
        this.isConnected = true;
        resolve();
      });

      socket.addEventListener('error', (err) => {
        console.error('[CDP Driver] WebSocket error:', err);
        if (!this.isConnected) reject(err);
      });

      socket.addEventListener('close', () => {
        this.isConnected = false;
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle RPC responses
          if (data.id !== undefined && this.pending.has(data.id)) {
            const { resolve: reqResolve, reject: reqReject, timer } = this.pending.get(data.id);
            clearTimeout(timer);
            this.pending.delete(data.id);

            if (data.error) {
              reqReject(new Error(`CDP Error ${data.error.code}: ${data.error.message}`));
            } else {
              reqResolve(data.result);
            }
            return;
          }

          // Handle CDP Events
          if (data.method) {
            if (data.method === 'Runtime.consoleAPICalled') {
              const text = (data.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
              this.consoleLogs.push({
                type: data.params.type,
                text,
                timestamp: data.params.timestamp,
              });
            }

            const listeners = this.eventListeners.get(data.method);
            if (listeners) {
              for (const cb of listeners) {
                try {
                  cb(data.params);
                } catch (e) {
                  console.error('[CDP Driver] Event listener error:', e);
                }
              }
            }
          }
        } catch (err) {
          console.error('[CDP Driver] Failed to parse message:', err);
        }
      });
    });
  }

  /**
   * Send a CDP command
   */
  send(method, params = {}, timeoutMs = 20000) {
    if (!this.isConnected || !this.ws) {
      return Promise.reject(new Error('CDP WebSocket is not connected'));
    }

    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP command '${method}' timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /**
   * Evaluate a JavaScript expression in the page context
   */
  async evaluate(expression, awaitPromise = true) {
    const exprStr = typeof expression === 'function' ? `(${expression.toString()})()` : expression;
    const res = await this.send('Runtime.evaluate', {
      expression: exprStr,
      returnByValue: true,
      awaitPromise,
    });

    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Evaluation exception: ${desc}`);
    }

    return res.result ? res.result.value : undefined;
  }

  /**
   * Wait for a DOM selector to appear
   */
  async waitForSelector(selector, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await this.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
      if (exists) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`Timeout waiting for selector: ${selector} (${timeoutMs}ms)`);
  }

  /**
   * Wait for a custom predicate function to return truthy
   */
  async waitForFunction(fn, timeoutMs = 10000, pollIntervalMs = 200) {
    const start = Date.now();
    const fnStr = typeof fn === 'function' ? `(${fn.toString()})()` : fn;
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.evaluate(fnStr);
        if (val) return val;
      } catch {
        // Ignore evaluation errors during polling
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`Timeout waiting for condition (${timeoutMs}ms)`);
  }

  /**
   * Click an element matching a CSS selector or containing specific text
   */
  async click(selector) {
    await this.waitForSelector(selector);
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found: " + ${JSON.stringify(selector)});
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        el.click();
        return true;
      })()
    `);
  }

  /**
   * Type text into an input or textarea element with React change dispatch
   */
  async typeText(selector, text) {
    await this.waitForSelector(selector);
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Input element not found: " + ${JSON.stringify(selector)});
        el.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(el, ${JSON.stringify(text)});
        } else {
          el.value = ${JSON.stringify(text)};
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()
    `);
  }

  /**
   * Read inner text of element
   */
  async getText(selector) {
    await this.waitForSelector(selector);
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        return el ? (el.innerText || el.textContent || '').trim() : null;
      })()
    `);
  }

  /**
   * Read attribute of element
   */
  async getAttribute(selector, attr) {
    await this.waitForSelector(selector);
    return this.evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        return el ? el.getAttribute(${JSON.stringify(attr)}) : null;
      })()
    `);
  }

  /**
   * Invoke backend Tauri IPC command directly inside desktop runtime
   */
  async invokeIpc(command, args = {}) {
    return this.evaluate(`
      window.__TAURI_INTERNALS__.invoke(
        ${JSON.stringify(command)},
        ${JSON.stringify(args)}
      )
    `);
  }

  /**
   * Capture a full-window screenshot and save as PNG
   */
  async captureScreenshot(outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[CDP Driver] Screenshot saved: ${outputPath} (${buffer.length} bytes)`);
    return outputPath;
  }

  /**
   * Retrieve all captured console logs
   */
  getConsoleLogs() {
    return [...this.consoleLogs];
  }

  /**
   * Stop the application and close CDP connection cleanly
   */
  async stop() {
    console.log('[CDP Driver] Stopping application and closing CDP...');
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }

    CdpDriver.killExistingProcesses(this.port);
    this.isConnected = false;
    await new Promise((r) => setTimeout(r, 500));
  }
}
