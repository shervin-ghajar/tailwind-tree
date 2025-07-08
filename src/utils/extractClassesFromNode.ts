/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Recursively extract all possible Tailwind class names from an AST node,
 * statically collecting both branches of conditionals and modifier prefixes.
 *
 * @param node Babel AST node
 * @param prefix Optional string prefix (e.g., "hover:")
 * @returns Flat array of class names (e.g., ["text-white", "hover:bg-red-900"])
 */
/**
 * Recursively extract Tailwind classes from a Babel AST node,
 * preserving variant prefixes (e.g., hover:).
 *
 * Avoids using @babel/types to keep bundle size small.
 */
export function extractClassesFromNode(node: any, prefix = ''): string[] {
  if (!node) return [];

  switch (node.type) {
    case 'Literal':
      // Only process string literals like 'bg-red-500'
      return typeof node.value === 'string' ? [prefix + node.value] : [];
    case 'TemplateLiteral':
      // Only support simple literals without expressions, e.g. `bg-green-500`
      if (node.expressions.length === 0) {
        const raw = node.quasis.map((q: any) => q.value.cooked).join('');
        return [prefix + raw];
      }
      // Otherwise dynamic template literal (skip or handle differently)
      return [];
    case 'ArrayExpression':
      return node.elements.flatMap((el: any) => extractClassesFromNode(el, prefix));

    case 'ObjectExpression':
      return node.properties.flatMap((prop: any) => {
        if (prop.type === 'Property') {
          const keyNode = prop.key;
          let key: string | undefined;

          if (keyNode.type === 'Identifier') key = keyNode.name;
          else if (keyNode.type === 'Literal' && typeof keyNode.value === 'string')
            key = keyNode.value;

          if (key !== undefined) {
            return extractClassesFromNode(prop.value, `${prefix}${key}:`);
          }
        }
        return [];
      });

    case 'ConditionalExpression':
      return [
        ...extractClassesFromNode(node.consequent, prefix),
        ...extractClassesFromNode(node.alternate, prefix),
      ];

    default:
      return [];
  }
}
