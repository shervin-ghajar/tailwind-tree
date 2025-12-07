/**
 * Tailwind class extractor for arbitrary code snippets.
 *
 * It supports:
 *  - twTree(...) calls via AST
 *  - Nested/prefixed objects (e.g. hover: 'bg-red text-blue')
 *  - JSX attribute scanning (className={...})
 *  - Plain class strings
 *  - Incomplete input lines and fallback recovery
 */
declare function extractTwTree(content: string): string[];
declare function isPrefixedString(content: string): boolean;

export { extractTwTree, isPrefixedString };
