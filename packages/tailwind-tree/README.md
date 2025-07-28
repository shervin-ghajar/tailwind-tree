
<div align="center">
  <a href="https://github.com/shervin-ghajar/tailwind-tree">
    <img src="https://raw.githubusercontent.com/shervin-ghajar/tailwind-tree/packages/shared/src/assets/logo-with-title.png" alt="tailwind-tree" style="max-width: 100%; height: 350px;">
  </a>
</div>

# Tailwind Tree

[![npm version](https://img.shields.io/npm/v/tailwind-tree.svg)](https://www.npmjs.com/package/tailwind-tree)
[![downloads](https://img.shields.io/npm/dm/tailwind-tree.svg)](https://www.npmjs.com/package/tailwind-tree)
[![license](https://img.shields.io/npm/l/tailwind-tree.svg)](LICENSE)

**Tailwind Tree** is a utility designed for writing deeply nested, composable Tailwind CSS classes using a simple and expressive tree structure. It simplifies the management of complex class combinations with responsive and interactive variants, supporting both **Tailwind v3** and **Tailwind v4**.

---

## ✨ Features

- ✅ Declarative nested syntax
- ✅ Full support for variants like `hover:`, `md:`, `focus:`, etc.
- ✅ Works with both **Tailwind v3** and **Tailwind v4**
- ✅ Automatic safelist generation or extractor integration
- ✅ Seamless merging using [`tailwind-merge`](https://www.npmjs.com/package/tailwind-merge)

---

## 📦 Installation

```bash
pnpm add tailwind-tree
# or
npm install tailwind-tree
# or
yarn add tailwind-tree
````

---

## 🚀 Usage

Instead of manually writing long utility strings, use `twTree` for cleaner, conditional, deeply nested Tailwind class composition.

### ✅ Traditional Approach

```html
<div class="bg-amber-500 text-nowrap hover:bg-slate-600 hover:text-clip md:focus:text-blue-700" />
```

### 🌲 Using `twTree`

```ts
import { twTree } from 'tailwind-tree';

<div
  className={twTree([
    'bg-amber-500 text-nowrap',
    {
      hover: ['bg-slate-600', 'text-clip'],
      md: [{ focus: ['text-blue-700'] }],
    },
  ])}
/>;
```

---

## 🧩 Complex Example

```ts
twTree([
  'text-white',
  isActive ? 'bg-green-500' : 'bg-green-300',
  {
    hover: [
      'underline',
      'opacity-50',
      isFocused ? 'bg-blue-200' : 'bg-blue-100',
      {
        active: ['scale-105', 'font-semibold'],
      },
    ],
    focus: [
      'ring-2',
      {
        visible: ['ring-green-500', isError ? 'ring-red-500' : 'ring-yellow-500'],
      },
    ],
  },
  anotherCondition ? 'p-4' : 'p-2',
  ['font-bold', 'tracking-wide'],
]);
```

Supports:

* Deep nesting of variants (`hover:active`, `focus:visible`)
* Ternaries and conditional logic
* Mixed string literals and arrays

---

## ⚙️ Tailwind Integration

> `twTree(...)` must be integrated into the Tailwind build pipeline to ensure your classes are **discovered** and **preserved** during purging.

Choose the right setup based on your Tailwind version:

---

## 🧪 Tailwind v3 Setup (using `@tailwind-tree/extractor`)

Use the official extractor to enable precise class extraction:

### 1. Install the extractor

```bash
pnpm add -D @tailwind-tree/extractor
```

### 2. Configure Tailwind

```ts
// tailwind.config.js
import { extractTwTree } from '@tailwind-tree/extractor';

export default {
  content: [
    {
      files: ['./src/**/*.{ts,tsx,js,jsx}'],
      extract: extractTwTree,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

✅ This approach eliminates redundant or missing classes by parsing `twTree(...)` directly.

---

## ⚙️ Tailwind v4 Setup (using `@tailwind-tree/vite-plugin`)

Since Tailwind v4 removed extractors, use the official plugin to inject safelisted classes:

### 1. Install the plugin

```bash
pnpm add -D @tailwind-tree/vite-plugin
```

### 2. Add it to your Vite config

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { twTreePlugin } from '@tailwind-tree/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    twTreePlugin(), // <--- this adds all twTree classes to Tailwind safelist
    tailwindcss(),
  ],
});
```

> 🧠 **Note:** Tailwind v4 may still generate **redundant classes** because it scans all string content. This is a limitation in Tailwind itself, not `twTree`.

---

## 🛠️ Options

The `twTree` function accepts a second `options` parameter:

```ts
twTree(input, options?)
```

| Option   | Type      | Default | Description                                                          |
| -------- | --------- | ------- | -------------------------------------------------------------------- |
| `merge`  | `boolean` | `true`  | Whether to apply `tailwind-merge` to deduplicate conflicting classes |
| `prefix` | `string`  | `""`    | Prefix to prepend to every class name                                |

### Example

```ts
twTree(['bg-red-500', { hover: ['bg-red-600'] }], {
  merge: false,
  prefix: 'tw-',
});
// → "tw-bg-red-500 tw-hover:bg-red-600"
```

---

## 📚 Related Packages

| Package                                                                                  | Description                                     |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`tailwind-tree`](https://www.npmjs.com/package/tailwind-tree)                           | Core `twTree` logic for nested class generation |
| [`@tailwind-tree/extractor`](https://www.npmjs.com/package/@tailwind-tree/extractor)     | Tailwind v3 content extractor                   |
| [`@tailwind-tree/vite-plugin`](https://www.npmjs.com/package/@tailwind-tree/vite-plugin) | Tailwind v4 Vite plugin for safelisting classes |

---

## 📜 License

MIT © [Shervin Ghajar](https://github.com/shervin-ghajar)

---

Made with 💙 by [@shervin-ghajar](https://github.com/shervin-ghajar)
