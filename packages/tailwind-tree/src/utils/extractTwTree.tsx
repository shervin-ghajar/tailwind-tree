import JSON5 from "json5";
import { twTree } from "./twTree";
import { twTreeRegex } from "../constants";

/**
 * Extracts Tailwind classes from source using custom logic.
 * @param content Source code string
 * @returns Array of unique class names
 */
export function extractTwTree(content: string): string[] {
  const matches = [...content.matchAll(twTreeRegex)];
  const classNames = new Set<string>();

  for (const match of matches) {
    try {
      const rawArray = match[1];
      const parsed = JSON5.parse(rawArray);
      const result = twTree(parsed);
      result
        .split(" ")
        .filter(Boolean)
        .forEach((cls: string) => classNames.add(cls));
    } catch (err) {
      console.warn(`⚠️ Failed to parse twTree(...) in extract.`, err);
    }
  }

  return [...classNames];
}
