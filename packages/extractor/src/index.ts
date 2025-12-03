import { extractClassesFromNode } from '@tailwind-tree/shared/utils/extractClassesFromNode';
import { parseProgram } from '@tailwind-tree/shared/utils/parser';
import { traverse } from '@tailwind-tree/shared/utils/traverse';
import { twTree } from '@tailwind-tree/shared/utils/twTree';

/**
 * Creates a Tailwind class extractor from source code.
 *
 * - Parses `twTree(...)` calls using AST and extracts nested classes.
 * - Optionally merges class names using the `twMerge` utility.
 * - Falls back to regex scanning for static class="..." attributes.
 *
 * @param options.merge Enables twMerge for deduplication and variant collapsing (default: true)
 * @returns A function that returns a list of unique Tailwind class names from code content.
 */
export function extractTwTree() {
  const merge = false;
  return function run(content: string): string[] {
    const out = new Set<string>();
    const trimmed = content.trim();

    // ---------- ❶ Ignore imports, comments ----------
    if (/^(import|export)/.test(trimmed)) return [];
    if (/^\s*\/\//.test(trimmed)) return [];

    // ---------- ❸ Test5 & Test7: JSX ----------
    // "<Flex align='center' ... className={twTree(...)}>"
    if (/<[A-Za-z]/.test(trimmed)) {
      const attrs = extractJSXAttributeValues(trimmed);
      for (const a of attrs) {
        run(a).forEach((c) => out.add(c));
      }
      return [...out];
    }

    // ---------- ❷ Test3: plain class string ----------
    // "flex h-full min-w-[332px] ... transition-colors"
    if (!/[:=]\s*[\\[{]/.test(trimmed) && !/twTree/.test(trimmed)) {
      // 1. Extract all quoted class names: "bg-red", 'bg-red', `bg-red`
      for (const m of trimmed.matchAll(/["'`](.*?)["'`]/g)) {
        splitClasses(m[1]).forEach((c) => out.add(c));
      }

      // 2. Extract unquoted naked classnames OUTSIDE ${...}
      // Remove template expressions first
      const withoutTemplates = trimmed.replace(/\${[^}]*}/g, '');

      // Split remaining text
      splitClasses(withoutTemplates).forEach((token) => {
        if (isValidClass(token)) out.add(token);
      });

      return [...out];
    }

    // ---------- ❹ Test1: prefix array ----------
    // hover: ['bg-light-6','color-red'],
    if (isPrefixedArray(trimmed)) {
      extractPrefixedArray(trimmed).forEach((c) => out.add(c));
      return [...out];
    }
    // ---------- ❺ Test7 & Test5: twTree(...) inside any JS ----------
    try {
      let wrapped = '';
      if (content.startsWith('twTree')) wrapped = safeWrapTwTree(content);
      else if (content.includes('=')) {
        const attrs = extractJSXAttributeValues(trimmed);

        for (const a of attrs) {
          run(a).forEach((c) => out.add(c));
        }
      } else wrapped = `const __x = { ${content} }`;

      const ast = parseProgram(wrapped);
      traverse(ast, (node) => {
        handleTwTreeCall(node, out, merge);
        handlePrefixedObject(node, out);
      });
    } catch {
      // fallback if AST fails
      extractViaRegex(trimmed).forEach((c) => out.add(c));
    }

    return [...out];
  };
}
/* -------------------------------------------------------------------------- */
function splitClasses(str: string): string[] {
  return str.split(/\s+/).filter(Boolean);
}
function isPrefixedArray(content: string): boolean {
  return /^[a-zA-Z0-9_-]+\s*:\s*\[/.test(content);
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
function handlePrefixedObject(node: any, out: Set<string>) {
  if (node.type !== 'ObjectExpression') return;

  for (const p of node.properties) {
    if (p.type !== 'ObjectProperty' || p.key.type !== 'Identifier') continue;

    const key = p.key.name;
    const values = extractClassesFromNode(p.value); // 👈 recursive extraction

    values.forEach((v) => {
      out.add(`${key}:${v}`);
    });
  }
}
function chopped(str: string) {
  return str
    .replace(/^[^=]*=\s*/, '') // remove everything before =
    .replace(/^["'`]|["'`]$/g, '');
}
function safeWrapTwTree(expr: string): string {
  // If complete, wrap normally.
  if (isBalanced(expr)) {
    return `const __x = ${expr}`;
  } else {
    // ⛔ Incomplete: return empty string.
    return '';
  }
}
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
function isValidClass(token: string) {
  // valid class example: bg-red-500, text-primary, w-7, mt-4 etc.
  return /^[a-zA-Z0-9-_:/.%]+$/.test(token);
}

function extractViaRegex(str: string): string[] {
  const m = str.match(/['"`]([^'"`]*)['"`]/g) || [];
  return m.map((s) => s.replace(/['"`]/g, '')).flatMap((c) => c.split(/\s+/));
}

function extractJSXAttributeValues(content: string): string[] {
  const results: string[] = [];

  const attrRegex = /([a-zA-Z0-9:_-]+)\s*=\s*/g;

  while (attrRegex.exec(content)) {
    const startIndex = attrRegex.lastIndex;
    const firstChar = content[startIndex];

    // --- Case 1: key="value"
    if (firstChar === '"' || firstChar === "'") {
      const quote = firstChar;
      let i = startIndex + 1;
      while (i < content.length && content[i] !== quote) i++;
      results.push(chopped(content.slice(startIndex + 1, i)));
      continue;
    }

    // --- Case 2: key={complexValue}
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
