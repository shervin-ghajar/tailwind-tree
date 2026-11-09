import { extendTailwindMerge, twMerge } from 'tailwind-merge';

import {
  twTree as flattenTree,
  type TreeOptions,
  type TreeValue,
} from '../../shared/src/utils/twTree';

export type {
  TreeOptions,
  TreeValue,
  TreeVariant,
  TreeVariants,
} from '../../shared/src/utils/twTree';
export interface TwTreeOptions extends TreeOptions {
  merge?: boolean | ((classes: string) => string);
}

let lastPrefix: string | undefined;
let prefixedMerge = twMerge;

export function twTree(input: readonly TreeValue[], options: TwTreeOptions = {}): string {
  const classes = flattenTree(input, options);
  if (options.merge === false) return classes;
  if (typeof options.merge === 'function') return options.merge(classes);
  if (!options.prefix) return twMerge(classes);
  const prefix = options.version === 3 ? options.prefix : options.prefix.replace(/:$/, '');
  if (prefix !== lastPrefix) {
    prefixedMerge = extendTailwindMerge({ prefix });
    lastPrefix = prefix;
  }
  return prefixedMerge(classes);
}
