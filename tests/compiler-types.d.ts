// Tailwind 3.0 predates its bundled TypeScript declarations; the tested plugin API is unchanged.
declare module 'tailwindcss-v3-0' {
  import tailwind from 'tailwindcss-v3';
  export default tailwind;
}
