import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { build, createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'tailwind-tree-browser-'));
let browser;
function packageVersion(entry) {
  let directory = path.dirname(entry);
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    const parent = path.dirname(directory);
    assert.notEqual(parent, directory, `No package metadata for ${entry}`);
    directory = parent;
  }
  return JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).version;
}

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  for (const version of [3, 4]) {
    const original = path.join(root, `packages/exampleV${version}`);
    const fixture = path.join(temporary, `v${version}`);
    fs.cpSync(original, fixture, {
      recursive: true,
      filter: (file) => !['node_modules', 'dist', '.tailwind-tree'].includes(path.basename(file)),
    });
    fs.symlinkSync(path.join(original, 'node_modules'), path.join(fixture, 'node_modules'));
    const require = createRequire(path.join(fixture, 'package.json'));
    assert.equal(packageVersion(require.resolve('tailwindcss')).split('.')[0], String(version));
    const libraryRequire = createRequire(require.resolve('tailwind-tree'));
    const mergerVersion = packageVersion(libraryRequire.resolve('tailwind-merge'));
    assert.equal(
      mergerVersion.split('.')[0],
      version === 3 ? '2' : '3',
      'Playground must use its own compatible merger peer',
    );
    const prefix = version === 3 ? 'tw-' : 'tw:';
    const variant = version === 3 ? 'md:hover:tw-' : 'tw:md:hover:';
    const server = await createServer({
      root: fixture,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 },
    });
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const requests = [];
    const errors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await server.listen();
      const address = server.httpServer.address();
      assert.ok(address && typeof address === 'object');
      await page.goto(`http://127.0.0.1:${address.port}`);
      const preview = page.locator('#preview');
      await preview.waitFor();
      const tokens = (await preview.getAttribute('class')).split(/\s+/);
      assert.ok(tokens.includes(`${prefix}p-6`));
      assert.ok(
        !tokens.includes(`${prefix}p-4`),
        'Matching merger must remove the conflicting padding',
      );
      assert.ok(tokens.includes(`${prefix}bg-blue-600`));
      assert.equal(await preview.evaluate((element) => getComputedStyle(element).width), '192px');
      assert.equal(
        await preview.evaluate((element) => getComputedStyle(element).paddingLeft),
        '24px',
      );
      const initialColor = await preview.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      await page.getByRole('button', { name: 'Toggle state' }).click();
      await page.waitForFunction(
        () => document.querySelector('button').getAttribute('aria-pressed') === 'true',
      );
      assert.ok(
        (await preview.getAttribute('class')).split(/\s+/).includes(`${prefix}bg-emerald-600`),
      );
      assert.notEqual(
        await preview.evaluate((element) => getComputedStyle(element).backgroundColor),
        initialColor,
      );
      await preview.hover();
      await page.waitForFunction(
        () => getComputedStyle(document.querySelector('#preview')).opacity === '0.5',
      );
      assert.ok(
        (await preview.getAttribute('class')).split(/\s+/).includes(`${variant}opacity-50`),
      );

      const token = await page.evaluate(() => {
        window.__playgroundToken = Math.random();
        return window.__playgroundToken;
      });
      const app = path.join(fixture, 'src/App.tsx');
      fs.writeFileSync(
        app,
        fs.readFileSync(app, 'utf8').replace('w-48', 'w-64').replace('opacity-50', 'opacity-75'),
      );
      await page.waitForFunction(() => {
        const style = getComputedStyle(document.querySelector('#preview'));
        return style.width === '256px' && style.opacity === '0.75';
      });
      assert.equal(
        await page.evaluate(() => window.__playgroundToken),
        token,
        'Class edits should hot update without reloading the page',
      );
      assert.equal(
        await page.getByRole('button', { name: 'Toggle state' }).getAttribute('aria-pressed'),
        'true',
        'React state should survive class edits',
      );
      assert.ok(
        (await preview.getAttribute('class')).split(/\s+/).includes(`${variant}opacity-75`),
      );
      assert.equal(errors.length, 0, errors.join('\n'));
      assert.ok(
        !requests.some((url) =>
          /@babel|utils\/(?:parser|extractTwTree|generateTwSafelist)/.test(url),
        ),
        'Build tooling must never load in the browser',
      );

      const moduleIds = [];
      await build({
        root: fixture,
        logLevel: 'silent',
        build: { write: false },
        plugins: [
          {
            name: 'check-runtime-modules',
            generateBundle(_, bundle) {
              for (const chunk of Object.values(bundle))
                if (chunk.type === 'chunk') moduleIds.push(...Object.keys(chunk.modules));
            },
          },
        ],
      });
      assert.ok(
        !moduleIds.some((id) =>
          /@babel|utils\/(?:parser|extractTwTree|generateTwSafelist)/.test(id),
        ),
        'Production browser bundle must exclude build tooling',
      );
      const mergers = new Set(
        moduleIds.filter((id) => id.includes('/tailwind-merge/')).map(packageVersion),
      );
      assert.deepEqual([...mergers], [mergerVersion], 'Only the compatible merger may ship');
      console.log(
        `Tailwind v${version} playground: merger ${mergerVersion}, rendered classes/styles, state toggle, hover, HMR without reload, and production module boundaries passed.`,
      );
    } finally {
      await page.close();
      await server.close();
    }
  }
} finally {
  await browser?.close();
  fs.rmSync(temporary, { recursive: true, force: true });
}
