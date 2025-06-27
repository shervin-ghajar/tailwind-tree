# 🌲 tailwind-tree

**Tailwind Tree** is a utility designed for writing deeply nested, composable Tailwind CSS classes using a simple and expressive tree structure. It simplifies the management of complex class combinations with responsive and interactive variants, supporting both **Tailwind** **v3** and **v4**.

---

## ✨ Features

- ✅ Declarative nested syntax
- ✅ Full support for variants such as `hover:`, `md:`, `focus:`, etc.
- ✅ Compatible with both **Tailwind v3** and **Tailwind v4**
- ✅ Automatic safelist generation for Tailwind's class scanning

---

## 📦 Installation

To install Tailwind Tree, you can use one of the following package managers:

```bash
pnpm add tailwind-tree
# or
npm install tailwind-tree
# or
yarn add tailwind-tree
```

---

## 🚀 Usage

Instead of manually writing long variant chains, you can utilize `twTree` for a more streamlined approach:

### Manual Approach

```html
<div class="bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl" />
```

### Using `twTree`

```ts
import { twTree } from "tailwind-tree";

<div
  className={twTree([
    "bg-red-500 text-white",
    {
      hover: ["bg-blue-500"],
      md: [{ focus: ["text-xl"] }],
    },
  ])}
/>;
```

This will produce the following output:

```ts
'bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl';
```

---

## ⚙️ Tailwind v4 Setup

With the removal of `content.extract` in Tailwind v4, the `tailwind-tree` library provides a plugin that automatically generates a safelist from `twTree(...)` usage.

### 1. Add the Plugin to Your Vite Config

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import { twTreePlugin } from 'tailwind-tree/node';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [twTreePlugin(), react()],
});
```

This configuration ensures that Tailwind includes all classes generated via `twTree`.

> 🧠 **Note:** Tailwind may still generate **redundant classes** since it scans all string content. This is a limitation of Tailwind v4's class detection system.

---

## ⚙️ Tailwind v3 Setup

In Tailwind v3, class extraction can be overridden directly using `content.extract`.

### 1. Import the Extractor

```ts
// tailwind.config.js
import { extractTwTree } from 'tailwind-tree';

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

This setup allows Tailwind to parse `twTree(...)` usage directly and **precisely extract nested classes**, eliminating redundancy.

---

## 🧪 Example

```tsx
twTree([
  'bg-amber-500 text-nowrap',
  {
    hover: ['bg-slate-600', 'text-clip'],
    md: {
      focus: ['text-blue-700'],
    },
  },
]);

// Result:
// "bg-amber-500 text-nowrap hover:bg-slate-600 hover:text-clip md:focus:text-blue-700"
```

---

## 📜 License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE file](https://github.com/shervin-ghajar/tailwind-tree/blob/main/packages/tailwind-tree/LICENSE).

---

Made with 💙 by [@shervin-ghajar](https://github.com/shervin-ghajar)

---
