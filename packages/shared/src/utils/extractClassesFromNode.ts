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
    case 'StringLiteral': {
      const parts = node.value.split(/\s+/).filter(Boolean);

      // if more than one, prefix each individually
      if (parts.length > 1) {
        return parts.map((p: string) => prefix + p);
      }

      return [prefix + node.value];
    }
    case 'TemplateLiteral':
      if (node.expressions.length === 0)
        return [prefix + node.quasis.map((q: any) => q.value.cooked).join('')];
      return [];
    case 'ArrayExpression':
      return node.elements.flatMap((el: any) => extractClassesFromNode(el, prefix));
    case 'ObjectExpression':
      return node.properties.flatMap((prop: any) => {
        if (prop.type === 'ObjectProperty') {
          let key: string | undefined;
          if (prop.key.type === 'Identifier') key = prop.key.name;
          else if (prop.key.type === 'StringLiteral') key = prop.key.value;
          if (key) return extractClassesFromNode(prop.value, `${prefix}${key}:`);
        } else if (prop.type === 'SpreadElement') {
          return extractClassesFromNode(prop.argument, prefix);
        }
        return [];
      });
    case 'ConditionalExpression':
      return [
        ...extractClassesFromNode(node.consequent, prefix),
        ...extractClassesFromNode(node.alternate, prefix),
      ];
    case 'LogicalExpression':
      return [
        ...extractClassesFromNode(node.left, prefix),
        ...extractClassesFromNode(node.right, prefix),
      ];
    case 'CallExpression':
      return node.arguments.flatMap((arg: any) => extractClassesFromNode(arg, prefix));
    case 'ParenthesizedExpression':
      return extractClassesFromNode(node.expression, prefix);
    case 'JSXExpressionContainer':
      return extractClassesFromNode(node.expression, prefix);
    default:
      return [];
  }
}
