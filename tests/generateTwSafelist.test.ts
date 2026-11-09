import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  generateTwSafelist,
  getAllSourceFiles,
  writeSafelistFile,
} from '../packages/shared/src/utils/generateTwSafelist';

let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-tree-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('candidate file generation', () => {
  it('writes complete candidates, replaces removed classes, and skips identical output', () => {
    const source = path.join(root, 'button.ts');
    const output = path.join(root, '.tailwind-tree/candidates.txt');
    fs.writeFileSync(source, `twTree(['p-4', {hover:'bg-red-500'}])`);
    generateTwSafelist([source], output);
    expect(fs.readFileSync(output, 'utf8')).toBe('hover:bg-red-500\np-4\n');
    expect(writeSafelistFile(['p-4', 'hover:bg-red-500'], output)).toBe(false);
    fs.writeFileSync(source, `twTree([{hover:'bg-blue-500'}])`);
    generateTwSafelist([source], output);
    expect(fs.readFileSync(output, 'utf8')).toBe('hover:bg-blue-500\n');
  });

  it('keeps quotes, backslashes, and arbitrary values as plain text', () => {
    const output = path.join(root, 'candidates.txt');
    writeSafelistFile(
      ['p-4', 'p-4', 'hover:before:content-["hello"]', String.raw`before:content-['a\\b']`],
      output,
    );
    expect(fs.readFileSync(output, 'utf8')).toContain('hover:before:content-["hello"]\n');
    expect(fs.readFileSync(output, 'utf8').match(/p-4/g)).toHaveLength(1);
  });

  it('does not follow symlinks or scan dependencies, hidden output, or declarations', () => {
    for (const dir of ['src', 'src/node_modules', 'src/dist', 'src/.cache'])
      fs.mkdirSync(path.join(root, dir), { recursive: true });
    for (const file of [
      'src/a.tsx',
      'src/b.mts',
      'src/c.cts',
      'src/types.d.ts',
      'src/node_modules/a.ts',
      'src/dist/a.ts',
      'src/.cache/a.ts',
    ])
      fs.writeFileSync(path.join(root, file), '');
    fs.symlinkSync(root, path.join(root, 'src/loop'));
    expect(getAllSourceFiles([path.join(root, 'src')]).map((file) => path.basename(file))).toEqual([
      'a.tsx',
      'b.mts',
      'c.cts',
    ]);
  });

  it('fails on unreadable source without replacing the last good output', () => {
    const output = path.join(root, 'candidates.txt');
    writeSafelistFile(['p-4'], output);
    expect(() => generateTwSafelist([path.join(root, 'missing.ts')], output)).toThrow();
    expect(fs.readFileSync(output, 'utf8')).toBe('p-4\n');
  });
});
