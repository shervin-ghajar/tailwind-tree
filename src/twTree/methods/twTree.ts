type TwInput = string | TwVariant;
type TwVariant = { [variant: string]: TwInput | TwInput[] };
type TwTreeInput = TwInput[];

/**
 * Recursively flattens a nested Tailwind-style class structure into a string.
 *
 * @param input - An array of Tailwind class strings or nested variant objects
 * @param prefix - A string prefix used to accumulate variant prefixes like `lg:` or `hover:`
 * @returns A space-separated string of Tailwind class names
 */
export function twTree(input: TwTreeInput, prefix = ""): string[] {
  const classes: string[] = [];

  for (const item of input) {
    if (typeof item === "string") {
      classes.push(prefix + item);
    } else if (typeof item === "object" && item !== null) {
      for (const variant in item) {
        const value = item[variant];
        const nested = Array.isArray(value) ? twTree(value, `${prefix}${variant}:`) : twTree([value], `${prefix}${variant}:`);

        classes.push(...nested);
      }
    }
  }

  return classes;
}
