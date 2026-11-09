import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { build, createServer, type ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { twTreePlugin } from '../packages/plugin/src';

const roots: string[] = [];
const servers: ViteDevServer[] = [];
const repo = fileURLToPath(new URL('..', import.meta.url));

function fixture(legacy = false, clean = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-vite-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, 'src'));
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'));
  fs.writeFileSync(
    path.join(root, 'index.html'),
    '<div id="app"></div><script type="module" src="/src/main.js"></script>',
  );
  fs.writeFileSync(path.join(root, 'src/main.js'), 'import "./style.css";');
  fs.writeFileSync(
    path.join(root, 'src/style.css'),
    `@import "tailwindcss"${clean ? ' source(none)' : ''};\n@source "../index.html";${legacy ? '\n@import "@tailwind-tree/vite-plugin/safelist";' : ''}`,
  );
  fs.writeFileSync(
    path.join(root, 'src/button.ts'),
    `import {twTree as tree} from 'tailwind-tree'; tree([{ md: {hover:'underline'} }]);`,
  );
  return root;
}
const config = (root: string) => ({
  root,
  configFile: false as const,
  logLevel: 'silent' as const,
  plugins: [twTreePlugin(), tailwindcss()],
});
const manifest = (root: string) =>
  fs.readFileSync(path.join(root, '.tailwind-tree/candidates.txt'), 'utf8');
const builtCss = (root: string) =>
  fs
    .readdirSync(path.join(root, 'dist/assets'))
    .filter((file) => file.endsWith('.css'))
    .map((file) => fs.readFileSync(path.join(root, 'dist/assets', file), 'utf8'))
    .join('');

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('Vite integration', () => {
  it.each([false, true])(
    'emits production CSS from a clean build (legacy import: %s)',
    async (legacy) => {
      const root = fixture(legacy);
      await build(config(root));
      const asset = fs
        .readdirSync(path.join(root, 'dist/assets'))
        .find((file) => file.endsWith('.css'))!;
      expect(fs.readFileSync(path.join(root, 'dist/assets', asset), 'utf8')).toContain(
        '.md\\:hover\\:underline',
      );
      expect(manifest(root)).toBe('md:hover:underline\n');
    },
  );

  it('removes raw tree leaves in clean mode while retaining ordinary sources and runtime code', async () => {
    const root = fixture();
    const file = path.join(root, 'src/button.ts');
    const source = `
      const leaf = 'underline';
      const input = [{md: {hover: leaf}}, {focus: active ? 'bg-red-500' : 'bg-blue-500'}];
      twTree(input);
      const ordinary = '<div class="text-center">';
    `;
    fs.writeFileSync(file, source);
    fs.appendFileSync(path.join(root, 'index.html'), '<div class="font-bold"></div>');
    await build(config(root));
    const automaticCss = builtCss(root);
    fs.writeFileSync(
      path.join(root, 'src/style.css'),
      '@import "tailwindcss" source(none);\n@source "../index.html";',
    );
    await build(config(root));
    const cleanCss = builtCss(root);
    const selectors: string[] = [];
    postcss.parse(cleanCss).walkRules((rule) => {
      selectors.push(rule.selector);
    });
    expect(cleanCss).toContain('.md\\:hover\\:underline');
    expect(cleanCss).toContain('.focus\\:bg-red-500');
    expect(cleanCss).toContain('.focus\\:bg-blue-500');
    expect(selectors).toContain('.text-center');
    expect(selectors).toContain('.font-bold');
    expect(selectors).not.toContain('.underline');
    expect(selectors).not.toContain('.bg-red-500');
    expect(selectors).not.toContain('.bg-blue-500');
    expect(cleanCss.length).toBeLessThan(automaticCss.length);
    expect(fs.readFileSync(file, 'utf8')).toBe(source);
  });

  it('keeps concurrent applications isolated and removes stale production classes', async () => {
    const first = fixture();
    const second = fixture();
    fs.writeFileSync(path.join(second, 'src/button.ts'), `twTree([{focus:'italic'}])`);
    await Promise.all([build(config(first)), build(config(second))]);
    expect(manifest(first)).toBe('md:hover:underline\n');
    expect(manifest(second)).toBe('focus:italic\n');
    fs.writeFileSync(path.join(first, 'src/button.ts'), `twTree([{focus:'block'}])`);
    await build(config(first));
    expect(manifest(first)).toBe('focus:block\n');
    const css = fs
      .readdirSync(path.join(first, 'dist/assets'))
      .filter((file) => file.endsWith('.css'))
      .map((file) => fs.readFileSync(path.join(first, 'dist/assets', file), 'utf8'))
      .join('');
    expect(css).not.toContain('.md\\:hover\\:underline');
    expect(css).toContain('.focus\\:block');
  });

  it.each([false, true])(
    'updates served CSS and candidates on changes, additions, renames, and deletions (clean: %s)',
    async (clean) => {
      const root = fixture(false, clean);
      const server = await createServer({
        ...config(root),
        server: { middlewareMode: true, hmr: false },
      });
      servers.push(server);
      expect((await server.transformRequest('/src/style.css'))?.code).toContain(
        'md\\\\:hover\\\\:underline',
      );
      const file = path.join(root, 'src/button.ts');
      const send = vi.spyOn(server.ws, 'send');
      const logError = vi.spyOn(server.config.logger, 'error');
      fs.writeFileSync(file, 'twTree([`p-${size}`])');
      await expect.poll(() => logError.mock.calls.length).toBeGreaterThan(0);
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(manifest(root)).toBe('md:hover:underline\n');
      fs.writeFileSync(file, `twTree([{focus:'italic'}])`);
      // Chokidar can coalesce rapid saves; deliver the recovery event explicitly.
      server.watcher.emit('change', file);
      await expect.poll(() => manifest(root)).toBe('focus:italic\n');
      await expect
        .poll(async () => (await server.transformRequest('/src/style.css'))?.code)
        .toContain('focus\\\\:italic');
      const added = path.join(root, 'src/added.ts');
      fs.writeFileSync(added, `twTree([{hover:'block'}])`);
      await expect.poll(() => manifest(root)).toBe('focus:italic\nhover:block\n');
      fs.renameSync(added, path.join(root, 'src/renamed.ts'));
      await expect.poll(() => manifest(root)).toBe('focus:italic\nhover:block\n');
      fs.unlinkSync(path.join(root, 'src/renamed.ts'));
      await expect.poll(() => manifest(root)).toBe('focus:italic\n');
      fs.unlinkSync(file);
      await expect.poll(() => manifest(root)).toBe('\n');
    },
  );

  it('refreshes ordinary classes when tree candidates stay unchanged in clean mode', async () => {
    const root = fixture(false, true);
    const file = path.join(root, 'src/button.ts');
    fs.appendFileSync(file, '\nconst html = \'<div class="text-center">\';');
    const server = await createServer({
      ...config(root),
      server: { middlewareMode: true, hmr: false },
    });
    servers.push(server);
    expect((await server.transformRequest('/src/style.css'))?.code).toContain('.text-center');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('text-center', 'text-right'));
    server.watcher.emit('change', file);
    await expect
      .poll(async () => (await server.transformRequest('/src/style.css'))?.code)
      .toContain('.text-right');
    expect(manifest(root)).toBe('md:hover:underline\n');
  });

  it('fails production builds with actionable extraction errors', async () => {
    const root = fixture();
    fs.writeFileSync(path.join(root, 'src/button.ts'), 'twTree([`p-${size}`])');
    await expect(build(config(root))).rejects.toThrow('button.ts');
  });
});
