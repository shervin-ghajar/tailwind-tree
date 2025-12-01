# @tailwind-tree/extractor

Tailwind Tree Extractor for Tailwind CSS v3  
🔍 A custom extractor to make [`tailwind-tree`](https://www.npmjs.com/package/tailwind-tree) work seamlessly with Tailwind's JIT engine.

---

## ✨ Why Use This?

If you're using [`twTree`](https://www.npmjs.com/package/tailwind-tree) to generate utility classes with variant nesting (like `hover:bg-red-500`, `md:focus:text-blue-600`, etc.), this extractor enables Tailwind v3 to **understand and extract those class names** during build time — without any extra setup.

---

## 📦 Installation

```bash
pnpm add -D @tailwind-tree/extractor
# or
yarn add -D @tailwind-tree/extractor
# or
npm install -D @tailwind-tree/extractor
```

---

## ⚙️ Usage

### 1. Import the Extractor

```ts
// tailwind.config.js (Tailwind v3)
import { extractTwTree } from '@tailwind-tree/extractor';

export default {
  content: [
    {
      files: ['./src/**/*.{ts,tsx,js,jsx}'],
      extract: extractTwTree(),
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

That's it! Tailwind will now parse `twTree(...)` usage directly and extract all nested classes — including variants — with full accuracy and zero noise.

---

## 🧠 How It Works

This extractor looks for `twTree(...)` function calls in your source code and statically extracts the final Tailwind utility strings from them.

This avoids bloating your final CSS file with unused classes and works even for deep variant chains and conditionals.

---

## 🔗 Related

- [`tailwind-tree`](https://www.npmjs.com/package/tailwind-tree): The class composition utility for deeply nested Tailwind variant structures.
