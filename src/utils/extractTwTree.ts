import JSON5 from 'json5';
import { fallbackClassRegex, twTreeRegex } from '../constants';
import { twTree } from './twTree';

/**
 * Extracts all Tailwind classes from a source string.
 * This includes:
 *  1. Classes defined via `twTree([...])` nested syntax
 *  2. Traditional string-based class detection (standard Tailwind strategy)
 *
 * This function is compatible with Tailwind v3 `content.extract` for custom class detection.
 *
 * @param content - The source code string (e.g. from .tsx/.js/.vue files)
 * @returns Array of unique Tailwind class names used in the file
 */
export function extractTwTree(content: string): string[] {
  const classNames = new Set<string>();
  const twTreeMatches = [...content.matchAll(twTreeRegex)];
  if (twTreeMatches.length > 0) {
    // 1. Extract classes from twTree([...])
    for (const match of content.matchAll(twTreeRegex)) {
      try {
        const parsed = JSON5.parse(match[1]);
        const result = twTree(parsed);
        result
          .split(' ')
          .filter(Boolean)
          .forEach((cls) => classNames.add(cls));
      } catch (err) {
        console.warn('⚠️ Failed to parse twTree(...) in extract.', err);
      }
    }
  } else {
    // 2. Fallback to default class detection (standard Tailwind strategy)
    const fallbackMatches = [...content.matchAll(fallbackClassRegex)];
    fallbackMatches.forEach((m) => {
      if (m[0]) classNames.add(m[0]);
    });
  }

  return [...classNames];
}
