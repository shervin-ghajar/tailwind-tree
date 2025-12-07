/* eslint-disable @typescript-eslint/no-explicit-any */
export function traverse(node: any, visit: (node: any, skip: () => void) => void) {
  let shouldSkip = false;
  const skip = () => {
    shouldSkip = true;
  };

  visit(node, skip);
  if (shouldSkip) return;
  const keys = Object.keys(node) as Array<keyof typeof node>;
  keys.forEach((key) => {
    const value = (node as any)[key];
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((child) => {
        if (child && typeof child.type === 'string') traverse(child, visit);
      });
    } else if (value && typeof value.type === 'string') {
      traverse(value, visit);
    }
  });
}
