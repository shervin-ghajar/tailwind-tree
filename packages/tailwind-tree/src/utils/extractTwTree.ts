import JSON5 from "json5";
import { twTree } from "./twTree";
import { fallbackClassRegex, twTreeRegex } from "../constants";

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
export function extractTwTree(content: string): string[] {
  const classNames = new Set<string>();

  // 1. Extract classes from twTree([...])
  for (const match of content.matchAll(twTreeRegex)) {
    try {
      const parsed = JSON5.parse(match[1]);
      const result = twTree(parsed);
      result
        .split(" ")
        .filter(Boolean)
        .forEach((cls) => classNames.add(cls));
    } catch (err) {
      console.warn("⚠️ Failed to parse twTree(...) in extract.", err);
    }
  }

  // 2. Extract fallback classes from any string-like props (e.g. className="...")
  for (const match of content.matchAll(fallbackClassRegex)) {
    const rawClasses = match[1];
    rawClasses
      .split(/\s+/)
      .filter(Boolean)
      .forEach((cls) => classNames.add(cls));
  }

  return [...classNames];
}
