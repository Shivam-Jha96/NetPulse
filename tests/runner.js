#!/usr/bin/env node

/**
 * IPTracer Standalone Cross-Platform Application
 * Automated End-to-End (E2E) Acceptance & Architecture Test Runner
 *
 * Programmatically verifies all 4 Tiers:
 * - Tier 1: Feature Completeness (R1 through R5)
 * - Tier 2: Boundary, Markup, CSS, JSON Schema & Structural Integrity
 * - Tier 3: Cross-Module Consistency & Contract Alignment
 * - Tier 4: Real-World Acceptance Criteria from ORIGINAL_REQUEST.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { runTier1Suite } from './suites/tier1_feature_completeness.js';
import { runTier2Suite } from './suites/tier2_boundary_integrity.js';
import { runTier3Suite } from './suites/tier3_cross_module_consistency.js';
import { runTier4Suite } from './suites/tier4_acceptance_criteria.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const docsRoot = path.join(projectRoot, 'docs');

// ANSI Color Codes for Terminal Output
const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Parse CLI Flags
const rawArgs = process.argv.slice(2);
const options = {
  tiers: [1, 2, 3, 4],
  format: 'pretty', // 'pretty' | 'tap' | 'json'
  verbose: false,
  bail: false,
  help: false
};

for (const arg of rawArgs) {
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg.startsWith('--tier=')) {
    options.tiers = arg
      .split('=')[1]
      .split(',')
      .map(t => parseInt(t.trim(), 10))
      .filter(t => [1, 2, 3, 4].includes(t));
  } else if (arg.startsWith('-t=')) {
    options.tiers = arg
      .split('=')[1]
      .split(',')
      .map(t => parseInt(t.trim(), 10))
      .filter(t => [1, 2, 3, 4].includes(t));
  } else if (arg.startsWith('--format=')) {
    options.format = arg.split('=')[1].toLowerCase();
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  } else if (arg === '--bail' || arg === '-b') {
    options.bail = true;
  }
}

if (options.help) {
  console.log(`
${Colors.bold}${Colors.cyan}IPTracer Standalone E2E Test Runner${Colors.reset}

Usage:
  node tests/e2e_standalone/runner.js [options]

Options:
  --tier=1,2,3,4     Specify which test tiers to execute (default: all)
  --format=FORMAT    Output format: pretty (default), tap, or json
  --verbose, -v      Print verbose diagnostic information
  --bail, -b         Stop execution on first test failure
  --help, -h         Display this help message

Test Tiers:
  Tier 1: Feature Completeness across R1 - R5
  Tier 2: Boundary, Markup, CSS, and Draft-07 JSON Schema Integrity
  Tier 3: Cross-Module Consistency between HLD, LLD, and UI Specs
  Tier 4: End-to-End Acceptance Criteria from ORIGINAL_REQUEST.md
`);
  process.exit(0);
}

// Test Registry
const testRegistry = [];

function registerTest(title, testFn) {
  testRegistry.push({ title, testFn });
}

// Execution Context
const context = {
  projectRoot,
  docsRoot,
  registerTest,
  options
};

async function main() {
  const startTime = performance.now();

  // Register requested suites
  if (options.tiers.includes(1)) {
    await runTier1Suite(context);
  }
  if (options.tiers.includes(2)) {
    await runTier2Suite(context);
  }
  if (options.tiers.includes(3)) {
    await runTier3Suite(context);
  }
  if (options.tiers.includes(4)) {
    await runTier4Suite(context);
  }

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  if (options.format === 'pretty') {
    console.log(`\n${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
    console.log(`${Colors.bold}${Colors.cyan}   IPTracer Standalone E2E Acceptance & Architecture Test Runner${Colors.reset}`);
    console.log(`${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
    console.log(`${Colors.gray}Target Directory: ${docsRoot}${Colors.reset}`);
    console.log(`${Colors.gray}Active Tiers: [${options.tiers.join(', ')}] | Total Tests: ${testRegistry.length}${Colors.reset}\n`);
  } else if (options.format === 'tap') {
    console.log('TAP version 13');
    console.log(`1..${testRegistry.length}`);
  }

  let currentTierHeader = '';

  for (let idx = 0; idx < testRegistry.length; idx++) {
    const test = testRegistry[idx];
    const testNum = idx + 1;
    const testStart = performance.now();

    // Grouping by Tier in pretty output
    if (options.format === 'pretty') {
      const tierMatch = test.title.match(/^(Tier \d+):/i);
      const tierName = tierMatch ? tierMatch[1].toUpperCase() : 'GENERAL';
      if (tierName !== currentTierHeader) {
        currentTierHeader = tierName;
        console.log(`\n${Colors.bold}${Colors.magenta}--- [${currentTierHeader}] ---${Colors.reset}`);
      }
    }

    try {
      await test.testFn();
      const testDuration = (performance.now() - testStart).toFixed(2);
      passedCount++;
      results.push({
        num: testNum,
        title: test.title,
        status: 'PASSED',
        durationMs: parseFloat(testDuration)
      });

      if (options.format === 'pretty') {
        console.log(`  ${Colors.green}✔${Colors.reset} ${test.title} ${Colors.gray}(${testDuration}ms)${Colors.reset}`);
      } else if (options.format === 'tap') {
        console.log(`ok ${testNum} - ${test.title}`);
      }
    } catch (err) {
      const testDuration = (performance.now() - testStart).toFixed(2);
      failedCount++;
      results.push({
        num: testNum,
        title: test.title,
        status: 'FAILED',
        durationMs: parseFloat(testDuration),
        error: {
          message: err.message,
          actual: err.actual,
          expected: err.expected,
          stack: err.stack
        }
      });

      if (options.format === 'pretty') {
        console.log(`  ${Colors.red}✖${Colors.reset} ${test.title} ${Colors.gray}(${testDuration}ms)${Colors.reset}`);
        console.log(`    ${Colors.red}Assertion Error:${Colors.reset} ${err.message}`);
        if (options.verbose && err.stack) {
          console.log(`    ${Colors.gray}${err.stack.split('\n').slice(1, 4).join('\n    ')}${Colors.reset}`);
        }
      } else if (options.format === 'tap') {
        console.log(`not ok ${testNum} - ${test.title}`);
        console.log(`  ---`);
        console.log(`  message: ${JSON.stringify(err.message)}`);
        console.log(`  ...`);
      }

      if (options.bail) {
        break;
      }
    }
  }

  const totalDuration = (performance.now() - startTime).toFixed(2);

  if (options.format === 'pretty') {
    console.log(`\n${Colors.bold}${Colors.cyan}----------------------------------------------------------------------${Colors.reset}`);
    console.log(`${Colors.bold}Test Execution Summary:${Colors.reset}`);
    console.log(`  Total Tests: ${Colors.bold}${testRegistry.length}${Colors.reset}`);
    console.log(`  Passed:      ${Colors.green}${Colors.bold}${passedCount}${Colors.reset}`);
    console.log(`  Failed:      ${failedCount > 0 ? Colors.red + Colors.bold : Colors.gray}${failedCount}${Colors.reset}`);
    console.log(`  Duration:    ${totalDuration}ms`);
    console.log(`${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}\n`);

    if (failedCount === 0) {
      console.log(`${Colors.green}${Colors.bold}✔ ALL E2E ACCEPTANCE TESTS PASSED SUCCESSFULLY (100% PASS RATE)${Colors.reset}\n`);
    } else {
      console.log(`${Colors.red}${Colors.bold}✖ SOME E2E ACCEPTANCE TESTS FAILED${Colors.reset}\n`);
    }
  } else if (options.format === 'tap') {
    console.log(`\n# tests ${testRegistry.length}`);
    console.log(`# pass ${passedCount}`);
    console.log(`# fail ${failedCount}`);
  } else if (options.format === 'json') {
    console.log(
      JSON.stringify(
        {
          summary: {
            total: testRegistry.length,
            passed: passedCount,
            failed: failedCount,
            durationMs: parseFloat(totalDuration),
            success: failedCount === 0
          },
          tiers: options.tiers,
          results
        },
        null,
        2
      )
    );
  }

  process.exit(failedCount === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(`${Colors.red}Fatal runner error:${Colors.reset}`, err);
  process.exit(2);
});
