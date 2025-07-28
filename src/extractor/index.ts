import chalk from 'chalk';

import { fallbackClassRegex, twTreeRegex } from '../constants';
import { extractClassesFromNode } from '../utils/extractClassesFromNode';
import { parseProgram } from '../utils/parser';
import { traverse } from '../utils/traverse';
import { twTree } from '../utils/twTree';

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
export function extractTwTree({ merge = true }: Partial<{ merge: boolean }> = {}) {
  return (content: string, filePath = '') => {
    const classNames = new Set<string>();
    const hasTwTreeCall = twTreeRegex.test(content);

    if (hasTwTreeCall) {
      try {
        const ast = parseProgram(content, filePath);
        if (ast) {
          traverse(ast, (node) => {
            // Detect twTree(...) usage
            if (
              node.type === 'CallExpression' &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'twTree' &&
              node.arguments.length > 0
            ) {
              const arg = node.arguments[0];
              const extracted = extractClassesFromNode(arg);

              // Merge variants using twMerge if enabled
              const flattened = twTree(extracted, { merge });

              // Split merged string and add to Set
              flattened
                .split(' ')
                .filter(Boolean)
                .forEach((cls) => classNames.add(cls));
            }
          });
        }
      } catch (err) {
        console.warn(chalk.yellow('⚠️ Failed to parse AST — falling back to regex matching.'), err);
      }
    }

    // Always include fallback regex matches like class="bg-red-500"
    const fallbackMatches = [...content.matchAll(fallbackClassRegex)];
    fallbackMatches.forEach((m) => {
      if (m[0]) classNames.add(m[0]);
    });

    return [...classNames];
  };
}
