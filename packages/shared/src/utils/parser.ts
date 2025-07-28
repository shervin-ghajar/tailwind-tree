import jsx from 'acorn-jsx';
import { LooseParser, parse } from 'acorn-loose';
import type * as ESTree from 'estree';

// Patch LooseParser with JSX support
LooseParser.extend(jsx());

export function parseProgram(code: string, filePath: string): ESTree.Program {
  try {
    return parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowHashBang: true,
    }) as unknown as ESTree.Program;
  } catch (error) {
    console.warn(`[acorn-loose] Failed to parse ${filePath}:`, error);
    return { type: 'Program', body: [] } as unknown as ESTree.Program;
  }
}
