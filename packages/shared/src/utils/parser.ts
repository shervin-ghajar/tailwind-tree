import { parse } from '@babel/parser';
import type { File } from '@babel/types';
import chalk from 'chalk';

export function parseProgram(code: string, filePath = ''): File {
  try {
    return parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch (err) {
    console.warn(chalk.yellow(`Parser failed to parse ${filePath}:`), err);
    console.log('parseProgramError', { code });
    return {
      type: 'File',
      program: { type: 'Program', body: [], sourceType: 'module' },
    } as unknown as File;
  }
}
