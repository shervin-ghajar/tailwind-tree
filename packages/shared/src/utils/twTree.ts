/** Common built-in variants; custom variants and breakpoints remain valid object keys. */
export type TreeVariant =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'hover'
  | 'focus'
  | 'focus-visible'
  | 'focus-within'
  | 'active'
  | 'visited'
  | 'disabled'
  | 'enabled'
  | 'checked'
  | 'required'
  | 'invalid'
  | 'first'
  | 'last'
  | 'odd'
  | 'even'
  | 'dark'
  | 'group-hover'
  | 'group-focus'
  | 'peer-checked'
  | 'before'
  | 'after'
  | 'motion-safe'
  | 'motion-reduce'
  | 'ltr'
  | 'rtl'
  | 'print';

export interface TreeVariants extends Readonly<Partial<Record<TreeVariant, TreeValue>>> {
  readonly [variant: string]: TreeValue;
}

export type TreeValue = string | false | null | undefined | readonly TreeValue[] | TreeVariants;

export interface TreeOptions {
  /** Tailwind namespace: `tw-` for v3, `tw` (or `tw:`) for v4. */
  prefix?: string;
  version?: 3 | 4;
  /** Skip static extraction when complete candidates are supplied through another Tailwind source. */
  extract?: boolean;
}

export function prefixClass(token: string, variants: string, options: TreeOptions): string {
  const prefix = options.prefix ?? '';
  if (!prefix) return variants + token;
  if (options.version !== 3) return `${prefix.replace(/:$/, '')}:${variants}${token}`;
  let depth = 0;
  let lastVariant = -1;
  for (let index = 0; index < token.length; index++) {
    if (token[index] === '[' || token[index] === '(') depth++;
    else if (token[index] === ']' || token[index] === ')') depth--;
    else if (token[index] === ':' && depth === 0) lastVariant = index;
  }
  variants += token.slice(0, lastVariant + 1);
  token = token.slice(lastVariant + 1);
  const important = token.startsWith('!') ? '!' : '';
  const utility = important ? token.slice(1) : token;
  const negative = utility.startsWith('-') ? '-' : '';
  return `${variants}${important}${negative}${prefix}${negative ? utility.slice(1) : utility}`;
}

/** Flatten first, then merge once at the public entrypoint. */
export function twTree(input: readonly TreeValue[], options: TreeOptions = {}): string {
  const classes: string[] = [];
  function collect(value: TreeValue, variants: string) {
    if (typeof value === 'string') {
      for (const token of value.split(/\s+/)) {
        if (token) classes.push(prefixClass(token, variants, options));
      }
    } else if (Array.isArray(value)) {
      for (const child of value) collect(child, variants);
    } else if (value && typeof value === 'object') {
      for (const [variant, child] of Object.entries(value))
        collect(child, `${variants}${variant}:`);
    }
  }
  collect(input, '');
  return classes.join(' ');
}
