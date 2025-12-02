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
declare function extractTwTree({ merge }?: Partial<{
    merge: boolean;
}>): (content: string, filePath?: string) => string[] | undefined;

export { extractTwTree };
