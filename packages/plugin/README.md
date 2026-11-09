# @tailwind-tree/vite-plugin

Vite integration for Tailwind Tree and Tailwind CSS v4.0+. Build tooling stays out of the browser runtime.

```sh
pnpm add tailwind-tree tailwind-merge@^3.0.0
pnpm add -D @tailwind-tree/vite-plugin @tailwindcss/vite
```

```ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { twTreePlugin } from '@tailwind-tree/vite-plugin';

export default defineConfig({
  plugins: [twTreePlugin(), tailwindcss()],
});
```

Keep the Tree plugin before Tailwind. Prefixes are optional. Both setups below use `source(none)` to avoid redundant rules from raw tree leaves and work on v4.0+. The CSS paths assume `src/index.css` and an application-root `index.html`.

## Without a prefix

```css
/* src/index.css */
@import 'tailwindcss' source(none);
@source '../index.html';
```

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }]);
// p-4 hover:bg-blue-500
```

## With an optional prefix

```css
/* src/index.css */
@import 'tailwindcss' prefix(tw) source(none);
@source '../index.html';
```

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }], { prefix: 'tw' });
// tw:p-4 tw:hover:bg-blue-500
```

`tw` is an example prefix; match it in the Tailwind import and `twTree` options. Tree leaf strings stay unprefixed. Ordinary markup uses complete classes such as `tw:p-4 tw:hover:bg-blue-500`. The plugin options and source registration are the same with or without a prefix.

## Source registration

```ts
twTreePlugin({
  sources: ['src', '../shared-ui/src'],
  output: '.tailwind-tree/candidates.txt',
});
```

Paths are relative to Vite's resolved root. `sources` accepts directories or files, not globs. The defaults are `['src']` and `.tailwind-tree/candidates.txt`. Ignore `.tailwind-tree/` in Git. Hidden folders, dependencies, build output, declarations, and symlinks are excluded.

The plugin automatically registers a second generated file, `<output>.sources.txt`, containing scan-only copies of the configured JS/TS sources. It replaces tree inputs and tree-only local constants with complete candidates while retaining ordinary classes, runtime conditions, shared constants, and exported values. It never transforms executable application code.

With `source(none)`, `sources` must include all JS/TS roots containing classes, including files without trees. Register other HTML/templates and external libraries with explicit `@source` paths relative to the stylesheet. Registering the original tree-containing files again reintroduces the redundant rules. Without `source(none)`, automatic detection remains enabled and raw leaf rules may remain. The legacy safelist import is still accepted.

The plugin handles changes, additions, renames, and deletions; unchanged files are not reparsed during development and unchanged candidates are not rewritten. It never writes into `node_modules` or shares state between applications. Production errors fail the build. Development errors show an overlay and preserve the last good output until fixed.

Only statically resolvable JS/TS trees are supported. Vue/Svelte templates, arbitrary runtime interpolation, cross-module tree references, and execution of arbitrary functions are outside the scanner contract. See the [main documentation](https://github.com/shervin-ghajar/tailwind-tree#readme) for the full syntax and merger compatibility rules.
