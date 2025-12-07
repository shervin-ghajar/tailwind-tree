/**
 * Parses a nested Tailwind class structure and returns a flattened string of classes
 * with variants applied, e.g., `hover:bg-red-500`, `md:focus:text-blue-600`.
 *
 * Supports nested variant objects like:
 * ```ts
 * twTree([
 *   "bg-red-500 text-white",
 *   { hover: ["bg-blue-500"], md: [{ focus: ["text-xl"] }] }
 * ])
 * // => "bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl"
 * ```
 *
 * @param input - Array of Tailwind class strings or nested variant objects
 * @param prefix - Internal use for recursive variant prefixing (e.g., `hover:`)
 * @returns A space-separated string of Tailwind classes with prefixes applied
 */
export declare function twTree<T extends string | object>(input: T[], prefix?: string): string;
