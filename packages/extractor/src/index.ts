import { fallbackClassRegex } from '@tailwind-tree/shared/constants/index';
import { extractClassesFromNode } from '@tailwind-tree/shared/utils/extractClassesFromNode';
import { parseProgram } from '@tailwind-tree/shared/utils/parser';
import { traverse } from '@tailwind-tree/shared/utils/traverse';
import { twTree } from '@tailwind-tree/shared/utils/twTree';
import chalk from 'chalk';

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
    console.log({ content });
    try {
      const ast = parseProgram(content, filePath);
      if (ast) {
        traverse(ast, (node) => {
          // Detect twTree(...) usage
          if (
            node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.arguments.length > 0
          ) {
            const arg = node.arguments[0];
            const extracted = extractClassesFromNode(arg);

            // Merge variants using twMerge if enabled
            const flattened = twTree(extracted, { merge });

            // Split merged string and add to Set

            flattened
              .split(/\s+/)
              .filter(Boolean)
              .forEach((cls) => classNames.add(cls));
          } else if (node.type === 'Program') {
            const arg = node.body[0];
            const extracted = extractClassesFromNode(arg);
            const flattened = twTree(extracted, { merge });
            flattened
              .split(/\s+/)
              .filter(Boolean)
              .forEach((cls) => classNames.add(cls));
          }
        });
      }
    } catch (err) {
      console.warn(chalk.yellow('⚠️ Failed to parse AST — falling back to regex matching.'), err);
    }
    // Always include fallback regex matches like class="bg-red-500"
    const fallbackMatches = [...content.matchAll(fallbackClassRegex)];
    fallbackMatches.forEach((m) => {
      if (m[0]) classNames.add(m[0]);
    });
    return [...classNames];
  };
}
