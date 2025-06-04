/* eslint-disable @typescript-eslint/no-explicit-any */
import { createUnplugin } from "unplugin";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { twTree } from "./methods/twTree";

function evaluateNode(node: t.Expression | t.SpreadElement | null): any {
  if (t.isStringLiteral(node)) {
    return node.value;
  } else if (t.isArrayExpression(node)) {
    return node.elements.map(evaluateNode);
  } else if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {};
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) {
        const key = t.isIdentifier(prop.key) ? prop.key.name : t.isStringLiteral(prop.key) ? prop.key.value : undefined;

        if (key !== undefined) {
          obj[key] = evaluateNode(prop.value as t.Expression);
        }
      }
    }
    return obj;
  }

  throw new Error(`Unsupported node type: ${node?.type}`);
}

export const TwParsePlugin = createUnplugin(() => {
  return {
    name: "vite-plugin-twparse",
    enforce: "pre" as const,

    transform(code: string, id: string) {
      if (!/\.(js|ts|jsx|tsx)$/.test(id)) return;

      let ast: t.File;

      try {
        ast = parser.parse(code, {
          sourceType: "module",
          plugins: ["typescript", "jsx"],
        });
      } catch (err) {
        console.error(`[twParsePlugin] Failed to parse file ${id}:`, err);
        return null;
      }

      let modified = false;

      traverse(ast, {
        CallExpression(path) {
          const callee = path.node.callee;

          if (t.isIdentifier(callee, { name: "twParse" })) {
            const arg = path.node.arguments[0];

            try {
              const parsed = evaluateNode(arg as any);
              const flattened = twTree(parsed).join(" ");
              path.replaceWith(t.stringLiteral(flattened));
              modified = true;
            } catch (err) {
              console.warn("[twParsePlugin] Could not evaluate twParse():", err);
            }
          }
        },
      });

      if (modified) {
        const output = generate(ast, {}, code);
        return {
          code: output.code,
          map: null,
        };
      }

      return null;
    },
  };
});
