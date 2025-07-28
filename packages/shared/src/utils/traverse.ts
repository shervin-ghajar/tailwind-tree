/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as ESTree from 'estree';

export function traverse(node: ESTree.Node, visit: (node: ESTree.Node) => void) {
  visit(node);

  for (const key in node as any) {
    const value = (node as any)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === 'string') {
          traverse(child, visit);
        }
      }
    } else if (value && typeof value.type === 'string') {
      traverse(value, visit);
    }
  }
}
