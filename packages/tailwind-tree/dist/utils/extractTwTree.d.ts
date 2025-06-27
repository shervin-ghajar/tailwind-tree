/**
 * Extracts all Tailwind classes from a source string.
 * This includes:
 *  1. Classes defined via `twTree([...])` nested syntax
 *  2. Traditional string-based class declarations (e.g., className="...")
 *
 * This function is compatible with Tailwind v3 `content.extract` for custom class detection.
 *
 * @param content - The source code string (e.g. from .tsx/.js/.vue files)
 * @returns Array of unique Tailwind class names used in the file
 */
export declare function extractTwTree(content: string): string[];
