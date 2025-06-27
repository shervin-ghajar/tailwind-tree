# 🌲 tailwind-tree

**Tailwind Tree** is a utility for writing deeply nested, composable Tailwind CSS classes using a simple and expressive tree structure.

It simplifies managing complex class combinations with responsive and interactive variants, and supports Tailwind CSS v3 **and** v4.

---

## ✨ Features

- ✅ Declarative nested syntax
- ✅ Full support for variants like `hover:`, `md:`, `focus:`, etc.
- ✅ Compatible with both **Tailwind v3** and **Tailwind v4**
- ✅ Automatic safelist generation for Tailwind's class scanning

---

## 📦 Installation

```bash
pnpm add tailwind-tree
# or
npm install tailwind-tree
# or
yarn add tailwind-tree
```

---

## 🚀 Usage

Instead of manually writing long variant chains like this:

```html
<div class="bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl" />
```

Use `twTree` like this:

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

This produces:

```ts
"bg-red-500 text-white hover:bg-blue-500 md:focus:text-xl";
```

---

## ⚙️ Tailwind v4 Setup

Tailwind v4 **removed** support for `content.extract` in `tailwind.config` file, so the `tailwind-tree` library provides a plugin that automatically generates a safelist from `twTree(...)` usage.

### 1. Add the plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { twTreePlugin } from "tailwind-tree/node";

export default defineConfig({
  plugins: [twTreePlugin(), react()],
});
```

This ensures Tailwind includes all classes generated via `twTree`.

> 🧠 **Note:** Tailwind may still generate **redundant classes** since it scans all string content. This is a limitation of Tailwind v4's class detection system.

---

## ⚙️ Tailwind v3 Setup

In Tailwind v3, class extraction can be overridden directly using `content.extract`.

### 1. Import the extractor:

```ts
// tailwind.config.js
import { extractTwTree } from "tailwind-tree";

export default = {
  content: [
    {
      files: ["./src/**/*.{ts,tsx,js,jsx}"],
      extract: extractTwTree,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

This allows Tailwind to parse `twTree(...)` usage directly and **precisely extract nested classes**, without redundancy.

---

## 🧪 Example

```tsx
twTree([
  "bg-amber-500 text-nowrap",
  {
    hover: ["bg-slate-600", "text-clip"],
    md: {
      focus: ["text-blue-700"],
    },
  },
]);

// Result:
// "bg-amber-500 text-nowrap hover:bg-slate-600 hover:text-clip md:focus:text-blue-700"
```

---

## 📜 License

MIT

---

Made with 💙 by [@shervin-ghajar](https://github.com/shervin-ghajar)
