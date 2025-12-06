import { twMerge } from 'tailwind-merge';

/**
 * Parses a nested Tailwind class structure and returns a flattened string of classes
 * with variants applied, e.g., `hover:bg-red-500`, `md:focus:text-blue-600`.
 *
 * Supports nested variant objects like:
 * ```ts
 * twTree([
 *   "bg-red-500 text-white",
 *   { hover: ["bg-blue-500"], md: [{ focus: ["text-xl"] }] }
 * ]);
 * // => "bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl"
 * ```
 *
 * @param input - Array of Tailwind class strings or nested variant objects.
 *                Objects can nest arbitrarily deep to represent variant chains.
 * @param options.prefix - Internal use for recursive variant prefixing (e.g., `hover:`).
 * @param options.merge - When true (default), merges and deduplicates classes using `tailwind-merge`.
 *                        When false, returns all classes without merging (useful for extraction/safelist).
 * @returns A space-separated string of Tailwind classes with prefixes applied.
 */
export function twTree<T extends string | object>(
  input: T[],
  options: { prefix?: string; merge?: boolean } = { prefix: '', merge: true },
): string {
  const classes: string[] = [];
  const prefix = options.prefix ?? '';
  input.forEach((item) => {
    if (typeof item === 'string') {
      const tokens = item.trim().split(/\s+/);
      tokens.forEach((token) => {
        const full = prefix + token;
        classes.push(full);
      });
    } else if (typeof item === 'object' && item !== null) {
      const keys = Object.keys(item) as Array<keyof typeof item & string>;
      keys.forEach((variant) => {
        const nestedClasses = item[variant];
        if (Array.isArray(nestedClasses)) {
          const nested = twTree(nestedClasses, {
            prefix: prefix ? `${prefix}${variant}:` : `${variant}:`,
            merge: options.merge,
          });
          classes.push(...nested.split(/\s+/));
        } else if (typeof nestedClasses === 'string' || typeof nestedClasses === 'object') {
          const nested = twTree([nestedClasses as T], {
            prefix: prefix ? `${prefix}${variant}:` : `${variant}:`,
            merge: options.merge,
          });
          classes.push(...nested.split(/\s+/));
        }
      });
    }
  });

  return options.merge ? twMerge(classes.join(' ')) : classes.join(' ');
}
