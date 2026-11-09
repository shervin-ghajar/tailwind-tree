export { extractTwTree, transformTwTree } from '../../shared/src/utils/extractTwTree';
export {
  collectUsedClasses,
  generateTwSafelist,
  writeSafelistFile,
} from '../../shared/src/utils/generateTwSafelist';

/** @deprecated Line-based extraction cannot preserve nested variants. */
export function isPrefixedString(content: string): boolean {
  return /^[a-zA-Z0-9_-]+\s*:\s*['"`]([^"'`]+)['"`],?$/.test(content.trim());
}
