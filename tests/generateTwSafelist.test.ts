import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { generateTwSafelist } from '../packages/shared/src/utils/generateTwSafelist';

// Temporary test file
const testFilePath = path.resolve(__dirname, 'twSafelistTestFile.ts');
const safelistPath = path.resolve(__dirname, 'safelist.css'); // default output
console.log({ safelistPath });
describe('generateTwSafelist', () => {
  beforeAll(() => {
    // Create a simple test file containing twTree usage
    const content = `
      import { twTree } from 'tailwind-tree';
      twTree([
        'text-white',
        'bg-green-500',
        { hover: ['underline', 'opacity-50'] }
      ]);
    `;
    writeFileSync(testFilePath, content, 'utf-8');
  });

  afterAll(() => {
    // Clean up
    unlinkSync(testFilePath);
    try {
      unlinkSync(safelistPath);
    } catch {
      /* empty */
    }
  });

  it('should generate safelist.css containing extracted classes', async () => {
    await generateTwSafelist([testFilePath], safelistPath);

    const output = readFileSync(safelistPath, 'utf-8');

    // Check that expected classes appear in safelist
    expect(output).toContain('@source inline("hover:underline")');
    expect(output).toContain('@source inline("hover:opacity-50")');
  });
});
