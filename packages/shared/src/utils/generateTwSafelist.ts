import fs from 'node:fs';
import path from 'node:path';
import { extractTwTree } from './extractTwTree';

const ignoredDirectories = new Set(['node_modules', 'dist', 'build', 'coverage']);
export const isSourceFile = (file: string) =>
  /\.[cm]?[jt]sx?$/.test(file) && !/\.d\.[cm]?ts$/.test(file);

/** Explicit source roots avoid scanning sibling apps, dependencies, and generated output. */
export function getAllSourceFiles(sources: readonly string[]): string[] {
  const files = new Set<string>();
  function visit(entry: string) {
    const stat = fs.lstatSync(entry);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(entry, { withFileTypes: true })) {
        if (child.name.startsWith('.') || ignoredDirectories.has(child.name)) continue;
        visit(path.join(entry, child.name));
      }
    } else if (isSourceFile(entry)) files.add(entry);
  }
  for (const source of sources) visit(path.resolve(source));
  return [...files].sort();
}

export function collectUsedClasses(sourceFiles: readonly string[]): Set<string> {
  const classes = new Set<string>();
  for (const file of sourceFiles) {
    for (const candidate of extractTwTree(fs.readFileSync(file, 'utf8'), file))
      classes.add(candidate);
  }
  return classes;
}

/** Plain text works with v3 content sources and v4.0+ @source without CSS escaping. */
export function writeSafelistFile(
  classes: readonly string[],
  safelistPath = path.resolve('.tailwind-tree/candidates.txt'),
): boolean {
  const contents = [...new Set(classes)].sort().join('\n') + '\n';
  if (fs.existsSync(safelistPath) && fs.readFileSync(safelistPath, 'utf8') === contents)
    return false;
  fs.mkdirSync(path.dirname(safelistPath), { recursive: true });
  const temporary = `${safelistPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, contents, 'utf8');
    fs.renameSync(temporary, safelistPath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return true;
}

/** Non-Vite builds can run this before their Tailwind CLI or PostCSS build. */
export function generateTwSafelist(filePaths?: readonly string[], safelistPath?: string): void {
  const files = filePaths ?? getAllSourceFiles([path.resolve('src')]);
  writeSafelistFile([...collectUsedClasses(files)], safelistPath);
}
