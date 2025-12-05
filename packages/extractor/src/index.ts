import { extractClassesFromNode } from '@tailwind-tree/shared/utils/extractClassesFromNode';
import { parseProgram } from '@tailwind-tree/shared/utils/parser';
import { traverse } from '@tailwind-tree/shared/utils/traverse';
import { twTree } from '@tailwind-tree/shared/utils/twTree';

/**
 * Tailwind class extractor for arbitrary code snippets.
 *
 * It supports:
 *  - twTree(...) calls via AST
 *  - Nested/prefixed objects (e.g. hover: ['bg-red'])
 *  - JSX attribute scanning (className={...})
 *  - Plain class strings
 *  - Incomplete input lines and fallback recovery
 */
export function extractTwTree() {
  const merge = false; // merge disabled for correctness during extraction

  return function run(content: string): string[] {
    const out = new Set<string>();
    const trimmed = content.trim();

    /* ──────────────────────────────────────────────────────────────────────────
     * ❶ Skip trivial or irrelevant lines (imports, comments)
     * ────────────────────────────────────────────────────────────────────────── */
    if (/^(import|export)/.test(trimmed)) return [];
    if (/^\s*\/\//.test(trimmed)) return [];

    /* ──────────────────────────────────────────────────────────────────────────
     * ❷ JSX Line Handling
     *    <Flex className="..." /> or className={twTree(...)}
     *    We extract each attribute value independently and recurse.
     * ────────────────────────────────────────────────────────────────────────── */
    if (/<[A-Za-z]/.test(trimmed)) {
      const attrs = extractJSXAttributeValues(trimmed);
      for (const a of attrs) run(a).forEach((c) => out.add(c));
      return [...out];
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * ❹ JS object prefix arrays:
     *    hover: ['bg-red', 'p-4']
     * ────────────────────────────────────────────────────────────────────────── */
    if (isPrefixedArray(trimmed)) {
      extractPrefixedArray(trimmed).forEach((c) => out.add(c));
      return [...out];
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * ❹.5 JS object prefixed strings:
     *    hover: "bg-red text-grey"
     *    focus: 'ring-2 ring-green-500'
     *    active: `p-2 text-xl`
     * ────────────────────────────────────────────────────────────────────────── */
    if (isPrefixedString(trimmed)) {
      const m = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*['"`](.*)['"`]/);
      if (m) {
        const prefix = m[1];
        const body = m[2];

        splitClasses(body).forEach((cls) => {
          if (cls) out.add(`${prefix}:${cls}`);
        });
      }
      return [...out];
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * ❸ Plain class strings with no JS syntax
     *    e.g. "flex p-4 bg-red"
     *    This covers raw HTML/TW strings or standalone className="text..."
     * ────────────────────────────────────────────────────────────────────────── */
    if (!/[:=]\s*[\\[{]/.test(trimmed) && !/twTree/.test(trimmed)) {
      // Extract "quoted" strings first
      for (const m of trimmed.matchAll(/["'`](.*?)["'`]/g)) {
        splitClasses(m[1]).forEach((c) => out.add(c));
      }

      // Remove ${...} template blocks and detect naked classes

      const withoutTemplates = trimmed.replace(/\${[^}]*}/g, '');
      splitClasses(withoutTemplates).forEach((token) => {
        if (isValidClass(token)) out.add(token);
      });

      return [...out];
    }

    /* ──────────────────────────────────────────────────────────────────────────
     * ❺ twTree(...) and general JavaScript handling
     *
     *  This covers:
     *   - twTree([...]) calls
     *   - twTree({ ... })
     *   - twTree inside JSX attributes
     *   - Incomplete code lines (critical!)
     *
     *  We try AST parsing when possible.
     *  If parsing fails, fallback to regex extraction.
     * ────────────────────────────────────────────────────────────────────────── */
    try {
      let wrapped = '';

      /* ───── Handle incomplete twTree([ ...   (missing closing ])
       *  Example: className={twTree([ h-7 w-7
       *  AST cannot be used → fallback raw extraction of classes inside the array.
       * ─────────────────────────────────────────────────────────────────────── */
      if (/twTree\s*\(\s*\[/.test(content) && !content.includes(']')) {
        const raw = content.replace(/.*twTree\s*\(\s*\[/, '');
        splitClasses(raw).forEach((c) => out.add(c));
        return [...out];
      } else if (content.startsWith('twTree')) {
        /* ───── Complete twTree(...) call (balanced brackets) ───── */
        wrapped = safeWrapTwTree(content);
      } else if (content.includes('=')) {
        /* ───── JSX-like: something={...} ───── */
        const attrs = extractJSXAttributeValues(trimmed);
        for (const a of attrs) run(a).forEach((c) => out.add(c));
      } else {
        /* ───── Generic expression: wrap as object literal ───── */
        wrapped = `const __x = { ${content} }`;
      }
      /* ────────────────────────────────────────────────────────
       * Try AST parsing of the wrapped content
       * ──────────────────────────────────────────────────────── */
      const ast = parseProgram(wrapped);

      if (ast?.program?.body?.length) {
        traverse(ast, (node) => {
          handleTwTreeCall(node, out, merge);
          handlePrefixedObject(node, out);
        });
      } else if (!out.size) {
        throw new Error('AST failed');
      }
    } catch {
      /* ──────────────────────────────────────────────────────────
       * If AST parsing explodes (very common for incomplete lines),
       * fall back to simple regex extraction.
       * ────────────────────────────────────────────────────────── */
      extractViaRegex(trimmed).forEach((c) => out.add(c));
    }

    return [...out];
  };
}

/* ============================================================================
 * Utility helpers
 * ========================================================================== */

function splitClasses(str: string): string[] {
  return str.split(/\s+/).filter(Boolean);
}

function isPrefixedArray(content: string): boolean {
  return /^[a-zA-Z0-9_-]+\s*:\s*\[/.test(content);
}

export function isPrefixedString(content: string): boolean {
  return /^[a-zA-Z0-9_-]+\s*:\s*['"`][^"'`]+['"`]\s*$/.test(content);
}

function extractPrefixedArray(content: string): string[] {
  const m = content.match(/^([a-zA-Z0-9_-]+)\s*:\s*\[(.*)\]/);
  if (!m) return [];
  const prefix = m[1];
  const body = m[2];

  return body
    .split(',')
    .map((x) => x.replace(/['"\s]/g, ''))
    .filter(Boolean)
    .map((v) => `${prefix}:${v}`);
}

/**
 * Handles twTree(...) AST nodes.
 * Extracts nested classes → flattens via twTree → adds to output.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleTwTreeCall(node: any, out: Set<string>, merge: boolean) {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'twTree' &&
    node.arguments.length > 0
  ) {
    const raw = extractClassesFromNode(node.arguments[0]);
    const flat = twTree(raw, { merge });

    flat
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => out.add(c));
  }
}

/**
 * Handles `{ hover: [...] }` shape objects inside twTree.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handlePrefixedObject(node: any, out: Set<string>) {
  if (node.type !== 'ObjectExpression') return;

  for (const p of node.properties) {
    if (p.type !== 'ObjectProperty' || p.key.type !== 'Identifier') continue;

    const key = p.key.name;
    const values = extractClassesFromNode(p.value);

    values.forEach((v) => out.add(`${key}:${v}`));
  }
}

/**
 * Removes everything before `=`, strips surrounding quotes.
 */
function chopped(str: string) {
  return str.replace(/^[^=]*=\s*/, '').replace(/^["'`]|["'`]$/g, '');
}

/**
 * Wraps twTree(expr) safely for AST parsing.
 * Returns empty string for incomplete expressions.
 */
function safeWrapTwTree(expr: string): string {
  if (isBalanced(expr)) return `const __x = ${expr}`;
  return ''; // AST must not parse this
}

/**
 * Simple balanced-bracket check to detect incomplete JS code.
 */
function isBalanced(expr: string): boolean {
  let round = 0,
    square = 0,
    curly = 0;

  for (const ch of expr) {
    if (ch === '(') round++;
    if (ch === ')') round--;
    if (ch === '[') square++;
    if (ch === ']') square--;
    if (ch === '{') curly++;
    if (ch === '}') curly--;
  }

  return round === 0 && square === 0 && curly === 0;
}

/**
 * Valid TW token: letters, numbers, %, /, :, _, -, .
 */
function isValidClass(token: string) {
  return /^[a-zA-Z0-9-_:/.%\\[\]]+$/.test(token);
}

/**
 * Fallback: Extract classes from quoted strings only.
 */
function extractViaRegex(str: string): string[] {
  const m = str.match(/['"`]([^'"`]*)['"`]/g) || [];
  return m.map((s) => s.replace(/['"`]/g, '')).flatMap((c) => c.split(/\s+/));
}

/**
 * Extracts values from JSX attributes:
 *  - key="value"
 *  - key={'value'}
 *  - key={complexExpression}
 */
function extractJSXAttributeValues(content: string): string[] {
  const results: string[] = [];
  const attrRegex = /([a-zA-Z0-9:_-]+)\s*=\s*/g;

  while (attrRegex.exec(content)) {
    const startIndex = attrRegex.lastIndex;
    const firstChar = content[startIndex];

    /* ----- Case 1: key="value" or key='value' ----- */
    if (firstChar === '"' || firstChar === "'") {
      const quote = firstChar;
      let i = startIndex + 1;
      while (i < content.length && content[i] !== quote) i++;
      results.push(chopped(content.slice(startIndex + 1, i)));
      continue;
    }

    /* ----- Case 2: key={...} (possibly nested) ----- */
    if (firstChar === '{') {
      let i = startIndex + 1;
      let depth = 1;

      while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }

      const raw = content.slice(startIndex + 1, i - 1).trim();
      results.push(chopped(raw));
      continue;
    }
  }

  return results;
}
