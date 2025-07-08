/* eslint-disable @typescript-eslint/no-explicit-any */
import { TSESTree } from '@typescript-eslint/typescript-estree';

export function traverse(node: TSESTree.Node, visit: (node: TSESTree.Node) => void) {
  visit(node);
  for (const key in node) {
    const value = (node as any)[key];
    if (Array.isArray(value)) {
      value.forEach((child) => {
        if (child && typeof child.type === 'string') {
          traverse(child, visit);
        }
      });
    } else if (value && typeof value.type === 'string') {
      traverse(value, visit);
    }
  }
}
