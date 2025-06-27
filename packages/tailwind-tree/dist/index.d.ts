declare function twTree(input: any[], prefix?: string): string;

/**
 * Extracts Tailwind classes from source using custom logic.
 * @param content Source code string
 * @returns Array of unique class names
 */
declare function extractTwTree(content: string): string[];

export { extractTwTree, twTree };
