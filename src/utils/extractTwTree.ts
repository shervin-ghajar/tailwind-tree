import { parse } from '@typescript-eslint/typescript-estree';
import chalk from 'chalk';

import { fallbackClassRegex, twTreeRegex } from '../constants';
import { extractClassesFromNode } from './extractClassesFromNode';
import { traverse } from './traverse';
import { twTree } from './twTree';

/**
 * Extracts all Tailwind classes from a source string.
 * Includes classes from twTree calls without merging,
 * plus fallback regex detection for standard Tailwind classes.
 */
export function extractTwTree(content: string): string[] {
  const classNames = new Set<string>();
  const twTreeMatches = [...content.matchAll(twTreeRegex)];

  if (twTreeMatches.length > 0) {
    try {
      const ast = parse(content, {
        range: false,
        jsx: true,
      });
      traverse(ast, (node) => {
        if (
          node.type === 'CallExpression' &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'twTree' &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          const classes = extractClassesFromNode(arg);
          const flattened = twTree(classes, { merge: false });
          flattened
            .split(' ')
            .filter(Boolean)
            .forEach((cls) => classNames.add(cls));
        }
      });
    } catch (err) {
      console.warn(chalk.yellow('⚠️ Babel parse failed, falling back to regex extraction.'), err);
    }
  } else {
    const fallbackMatches = [...content.matchAll(fallbackClassRegex)];
    fallbackMatches.forEach((m) => {
      if (m[0]) classNames.add(m[0]);
    });
  }

  return [...classNames];
}
