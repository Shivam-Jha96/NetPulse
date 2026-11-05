/**
 * Markdown & Mermaid Diagram Integrity Parser.
 * Validates markdown formatting, unclosed code fences, table integrity,
 * and extracts/checks syntax validity of Mermaid diagram definitions.
 */

export class MarkdownParser {
  /**
   * Parse a markdown document and return structured analysis.
   * @param {string} content - Markdown file content
   * @returns {{
   *   headings: { level: number, text: string, anchor: string, line: number }[],
   *   codeBlocks: { lang: string, code: string, startLine: number, endLine: number }[],
   *   mermaidDiagrams: { type: string, code: string, startLine: number, valid: boolean, errors: string[] }[],
   *   tables: { header: string[], rowCount: number, line: number }[],
   *   fencesBalanced: boolean,
   *   unclosedFenceLine: number | null,
   *   errors: string[]
   * }}
   */
  static parse(content) {
    const lines = content.split(/\r?\n/);
    const headings = [];
    const codeBlocks = [];
    const mermaidDiagrams = [];
    const tables = [];
    const errors = [];

    let inFence = false;
    let fenceLang = '';
    let fenceStartLine = 0;
    let fenceBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // Check code fence toggle
      const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
      if (fenceMatch) {
        if (!inFence) {
          inFence = true;
          fenceLang = fenceMatch[3].trim().toLowerCase();
          fenceStartLine = lineNum;
          fenceBuffer = [];
        } else {
          // Closing fence
          inFence = false;
          const code = fenceBuffer.join('\n');
          codeBlocks.push({
            lang: fenceLang,
            code,
            startLine: fenceStartLine,
            endLine: lineNum
          });

          if (fenceLang === 'mermaid') {
            const mermaidCheck = this.validateMermaid(code, fenceStartLine);
            mermaidDiagrams.push(mermaidCheck);
            if (!mermaidCheck.valid) {
              for (const err of mermaidCheck.errors) {
                errors.push(`Mermaid diagram at line ${fenceStartLine}: ${err}`);
              }
            }
          }
          fenceBuffer = [];
          fenceLang = '';
        }
        continue;
      }

      if (inFence) {
        fenceBuffer.push(line);
        continue;
      }

      // Check Headings (# Heading)
      const headMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headMatch) {
        const level = headMatch[1].length;
        const text = headMatch[2].trim();
        const anchor = this.slugify(text);
        headings.push({ level, text, anchor, line: lineNum });
        continue;
      }

      // Check Table separator line (|---|---|)
      if (line.includes('|') && /^\s*\|?\s*:?-+:?\s*\|/.test(line)) {
        if (i > 0 && lines[i - 1].includes('|')) {
          const headerCells = lines[i - 1]
            .split('|')
            .map(c => c.trim())
            .filter(c => c.length > 0);
          tables.push({
            header: headerCells,
            rowCount: 0,
            line: lineNum
          });
        }
      }
    }

    let unclosedFenceLine = null;
    if (inFence) {
      unclosedFenceLine = fenceStartLine;
      errors.push(`Unclosed code fence starting at line ${fenceStartLine}`);
    }

    return {
      headings,
      codeBlocks,
      mermaidDiagrams,
      tables,
      fencesBalanced: !inFence,
      unclosedFenceLine,
      errors
    };
  }

  /**
   * Validate Mermaid diagram definition syntax.
   * @param {string} code - Diagram code
   * @param {number} startLine - Line number in markdown
   * @returns {{ type: string, code: string, startLine: number, valid: boolean, errors: string[] }}
   */
  static validateMermaid(code, startLine) {
    const trimmed = code.trim();
    const errors = [];

    if (!trimmed) {
      return {
        type: 'empty',
        code,
        startLine,
        valid: false,
        errors: ['Mermaid diagram block is empty']
      };
    }

    const firstLine = trimmed.split('\n')[0].trim();
    const recognizedTypes = [
      'graph',
      'flowchart',
      'sequencediagram',
      'classdiagram',
      'statediagram',
      'statediagram-v2',
      'erdiagram',
      'gantt',
      'pie',
      'gitgraph',
      'mindmap',
      'c4context',
      'c4container',
      'c4component',
      'journey',
      'timeline',
      'quadrantchart',
      'sankey-beta',
      'xychart-beta'
    ];

    const typeKey = firstLine.toLowerCase().split(/\s+/)[0];
    const isRecognized = recognizedTypes.some(t => firstLine.toLowerCase().startsWith(t));

    if (!isRecognized) {
      errors.push(`Unrecognized Mermaid diagram type: "${firstLine}"`);
    }

    // Bracket balancing check in diagram
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Unbalanced square brackets: [ = ${openBrackets}, ] = ${closeBrackets}`);
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Unbalanced parentheses: ( = ${openParens}, ) = ${closeParens}`);
    }

    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Unbalanced curly braces: { = ${openBraces}, } = ${closeBraces}`);
    }

    return {
      type: typeKey,
      code,
      startLine,
      valid: errors.length === 0,
      errors
    };
  }

  static slugify(text) {
    return text
      .toLowerCase()
      .replace(/<[^>]+>/g, '') // strip HTML
      .replace(/[^\w\s-]/g, '') // remove special chars
      .trim()
      .replace(/\s+/g, '-');
  }
}
