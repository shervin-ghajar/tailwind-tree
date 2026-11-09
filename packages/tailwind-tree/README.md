# Tailwind Tree

Compose Tailwind classes with nested variants. The browser runtime is separate from the Node-only source scanner and Vite plugin.

```tsx
import { twTree } from 'tailwind-tree';

const classes = twTree([
  'flex p-4',
  enabled && 'font-bold',
  ['tracking-wide'],
  { md: { hover: active ? 'bg-blue-500' : 'bg-red-500' } },
]);
// flex p-4 font-bold tracking-wide md:hover:bg-blue-500 (when enabled and active)
```

## Installation and merging

Install the merger version that matches your Tailwind major. It is an optional peer dependency: the default entrypoint requires it, while `tailwind-tree/core` does not.

```sh
# Tailwind v3
pnpm add tailwind-tree tailwind-merge@^2.6.0

# Tailwind v4
pnpm add tailwind-tree tailwind-merge@^3.0.0
```

`twTree(input, options)` accepts readonly nested arrays, strings, variant objects, `false`, `null`, and `undefined`. Empty strings are ignored. Merging happens once after flattening.

| Option    | Default | Meaning                                                                                           |
| --------- | ------- | ------------------------------------------------------------------------------------------------- |
| `merge`   | `true`  | `false` preserves conflicts; a `(classes: string) => string` function uses your configured merger |
| `prefix`  | `''`    | Optional Tailwind namespace: `tw-` for v3 or `tw` / `tw:` for v4                                  |
| `version` | `4`     | Controls namespace placement; set `3` for v3 prefixes                                             |
| `extract` | `true`  | Set `false` only when another Tailwind source supplies every candidate                            |

```ts
twTree([{ hover: '!p-4 -mt-2' }], { version: 3, prefix: 'tw-' });
// hover:!tw-p-4 hover:-tw-mt-2

twTree([{ hover: 'p-2 p-4' }], { prefix: 'tw' });
// tw:hover:p-4
```

Prefixes are optional; omit `prefix` from both Tailwind and `twTree` for ordinary class names. When enabled, configure the same prefix in both. The tutorials below show each setup for v3 and v4. For custom themes or conflict rules, pass an application-configured `tailwind-merge` function through `merge`.

To avoid the merger entirely:

```ts
import { twTree } from 'tailwind-tree/core';
twTree(['p-2', 'p-4']); // p-2 p-4
```

The core entry has no runtime dependencies. No parser or filesystem code is reachable from either browser entrypoint.

## Variant key autocomplete

VS Code's built-in JavaScript/TypeScript support suggests common variant keys such as `hover`, `focus`, `md`, and `lg` inside inline trees, including nested objects and arrays. No editor extension or runtime code is required for these object-key suggestions. Custom variants, arbitrary selectors, and custom breakpoints remain valid keys; suggestions are a common built-in set, not a validation of your Tailwind configuration.

For a separately declared object, give the editor a contextual type:

```ts
import { twTree, type TreeVariants } from 'tailwind-tree';

const variants = {
  hover: 'bg-slate-800',
  md: { hover: 'opacity-50' },
} satisfies TreeVariants;

twTree([variants]);
```

Press `Ctrl+Space` inside a variant object to request suggestions. The same types are exported from `tailwind-tree/core`. This is independent of utility-string completion from Tailwind CSS IntelliSense.

## Tailwind v3: transform complete files

```sh
pnpm add -D @tailwind-tree/extractor
```

Use **`content.transform`**, which receives complete files. A line-based `content.extract` callback cannot preserve multiline variant nesting. Keep Tailwind's default scanner to discover ordinary classes, arbitrary values, and framework attributes.

```js
// tailwind.config.js
import { transformTwTree } from '@tailwind-tree/extractor';

export default {
  content: {
    files: ['./src/**/*.{js,jsx,ts,tsx}'],
    transform: {
      js: transformTwTree,
      jsx: transformTwTree,
      ts: (source) => transformTwTree(source, 'source.ts'),
      tsx: transformTwTree,
    },
  },
  theme: { extend: {} },
  plugins: [],
};
```

Your stylesheet uses the standard v3 directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Without a prefix

Leave `prefix` unset in both Tailwind and `twTree`:

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3 });
// p-4 hover:bg-blue-500
```

### With an optional prefix

Add `prefix: 'tw-'` to the Tailwind config above and pass the same prefix to `twTree`:

```ts
import { twTree } from 'tailwind-tree';

twTree(['p-4', { hover: 'bg-blue-500' }], { version: 3, prefix: 'tw-' });
// tw-p-4 hover:tw-bg-blue-500
```

Keep tree leaf strings unprefixed; `twTree` adds the prefix. Ordinary markup uses complete classes such as `tw-p-4 hover:tw-bg-blue-500`. The stylesheet directives and `content.transform` setup are the same in both cases.

`extractTwTree(source, filename?)` is also exported for complete JS/TS files. It returns the statically discoverable candidates; it is **not** a replacement for Tailwind's default line extractor.

## Tailwind v4: Vite

```sh
pnpm add -D @tailwind-tree/vite-plugin @tailwindcss/vite
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { twTreePlugin } from '@tailwind-tree/vite-plugin';

export default defineConfig({
  plugins: [twTreePlugin(), tailwindcss()],
});
```

Place `twTreePlugin()` **before** `tailwindcss()`. Both setups below work with Tailwind v4.0+ and use explicit scanning to avoid redundant rules from raw tree leaves, such as `.underline` from `{ md: { hover: 'underline' } }`. The CSS examples assume your stylesheet is in `src` and `index.html` is in the application root.

### Without a prefix

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

### With an optional prefix

Add `prefix(tw)` to the Tailwind import and pass `prefix: 'tw'` to `twTree`:

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

Keep tree leaf strings unprefixed; `twTree` adds the prefix. Ordinary markup uses complete classes such as `tw:p-4 tw:hover:bg-blue-500`. `tw` is only an example prefix. Prefixing and explicit source scanning are independent; neither `source(none)` nor the plugin requires a prefix.

The plugin defaults to scanning `src` under Vite's resolved root and writes `.tailwind-tree/candidates.txt` there. It also registers `.tailwind-tree/candidates.txt.sources.txt`: scan-only copies of the configured JS/TS sources with tree inputs replaced by complete candidates. Ordinary classes, runtime conditions, and constants shared outside trees stay visible. Application code is unchanged. Add `.tailwind-tree/` to `.gitignore`; each app owns its generated files.

With `source(none)`, include every JS/TS root containing classes in the plugin's `sources` option, including files without trees. Register other templates or external libraries with `@source`, relative to the stylesheet. Registering original tree-containing JS/TS files again restores the extra leaf rules. If you keep Tailwind's automatic scanning instead, `@import 'tailwindcss';` also works, but raw leaf rules may remain.

```ts
twTreePlugin({
  sources: ['src', '../shared-ui/src'], // directories or individual JS/TS files, not globs
  output: '.tailwind-tree/candidates.txt',
});
```

The scanner supports `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts`; it excludes declarations, hidden directories, dependencies, build output, and symlinks. It does not parse Vue/Svelte templates or follow imported tree values across modules. Existing `@import '@tailwind-tree/vite-plugin/safelist';` statements remain supported and are replaced by the plugin.

Development updates reparse only the changed source file. Additions, renames, and deletions update the complete candidate set. Identical output is not rewritten. Invalid source shows a development overlay and retains the last good candidates until corrected; production builds fail with the source filename. Tailwind may retain already-generated CSS during a development session; a fresh production build removes unused candidates.

## CLI and PostCSS builds without Vite

Generate the same plain-text candidates before invoking your Tailwind build:

```js
// generate-tailwind.mjs
import { generateTwSafelist } from '@tailwind-tree/extractor';
generateTwSafelist(); // scans ./src, replaces ./.tailwind-tree/candidates.txt

// Or provide explicit files and an output path:
// generateTwSafelist(['src/button.tsx'], '.tailwind-tree/candidates.txt');
```

For v3, include `.tailwind-tree/candidates.txt` in `content` alongside your ordinary source globs. For v4, register it in the stylesheet, using a path relative to that stylesheet:

```css
@import 'tailwindcss';
@source '../.tailwind-tree/candidates.txt';
```

Run the generator before each build or from your existing watcher. It replaces the candidate set rather than preserving deleted classes.

## Static extraction contract

Supported: multiline trees, named import aliases, namespace imports, local immutable constant references, constant computed variant keys, nested arrays, literal spreads, conditional branches, logical `&&` gates, static template strings, and TypeScript `as const` / `satisfies` wrappers. Options that affect class names (`prefix` and `version`) must also be statically resolvable.

Unsupported expressions fail clearly. Do not interpolate class fragments such as `` `p-${size}` ``, call arbitrary helper functions inside a tree, mutate a tree after declaring it, or expect the scanner to evaluate imported values. Use finite local alternatives, complete classes in explicit Tailwind sources, or CSS variables for values that are only known at runtime.

When complete candidates are supplied by another Tailwind source, opt out per call with `twTree(dynamicInput, { extract: false })`. This keeps runtime composition available without pretending dynamic values can be inferred.

The tree preserves variant order. Tailwind v3 and v4 apply order-sensitive stacked variants differently; migrating those selectors is the application's responsibility. Only utilities and variants supported by your Tailwind version can produce CSS. The v3 transform and v4 explicit scanning setup remove tree-only leaf tokens. Constants also used outside trees or exported remain available to ordinary scanning; static extraction retains all conditional branches and does not attempt runtime conflict merging.

## Compatibility and development

Tests compile actual CSS with Tailwind **3.0.24, 3.4.17, 4.0.17, 4.1.17, and 4.3.5**. They cover version-specific prefixes and utility syntax. The Vite integration is tested with Vite 6, 7, and 8 and current Tailwind v4. Node **20.19+** is required for the build integrations. Plugin declarations use TypeScript 5.3+ import-resolution attributes; declaration checks run on TypeScript 5.8.

This is a pnpm workspace. `shared` is private source code bundled into the public packages; it is not a public dependency. Parser dependencies stay external in the Node packages so the package manager can deduplicate them. The separate v3 and v4 playgrounds consume workspace packages with injected peer contexts, so each runtime resolves its own compatible merger. Builds synchronize those injected copies; they do not share a merger through the workspace symlink.

```sh
pnpm install
pnpm build:all   # lint, build, types, compiler/Vite/browser tests, packed consumers, sizes, examples
pnpm size        # browser sizes include the merger; Node sizes exclude declared external dependencies
pnpm dev:v3      # Tailwind v3 playground with merger 2.6
pnpm dev:v4      # exampleV4, Tailwind v4 playground with merger 3.x
pnpm test:playgrounds # real browser classes, computed styles, state changes, and HMR
```

`pnpm test:playgrounds` requires an installed Chrome browser (Chrome is present on the configured Ubuntu CI runners). Browser checks run on temporary copies of both playgrounds, so source-edit tests never change your working files. They verify that hot edits preserve state without a reload and that the production module graph contains only the matching merger and no scanner/parser code.

`pnpm test:packages` packs the public packages and checks ESM, CommonJS, declarations, CSS exports, both merger majors, and the peer-free core in an isolated consumer. It does not publish anything.

MIT © Shervin Ghajar
