import { parse } from '@babel/parser';

export function parseProgram(code: string, filePath = 'source.tsx') {
  try {
    return parse(code, {
      sourceType: 'unambiguous',
      plugins: /\.[cm]?ts$/.test(filePath) ? ['typescript'] : ['typescript', 'jsx'],
    });
  } catch (error) {
    throw new Error(`tailwind-tree: Cannot parse ${filePath}: ${(error as Error).message}`, {
      cause: error,
    });
  }
}
