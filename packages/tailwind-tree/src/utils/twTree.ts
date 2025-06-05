/* eslint-disable @typescript-eslint/no-explicit-any */

export const classCollector = new Set<string>([]);

export function twTree(input: any[], prefix = ""): string {
  const classes: string[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      const fullClass = prefix + item;
      classes.push(fullClass);
      classCollector.add(fullClass);
    } else if (typeof item === "object" && item !== null) {
      for (const variant in item) {
        const nested = twTree(item[variant], `${prefix}${variant}:`);
        classes.push(nested);
      }
    }
  }

  return classes.join(" ");
}
