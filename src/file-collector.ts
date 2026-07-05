/**
 * File Collector - Collects files from local directories
 */

import * as fs from "fs";
import * as path from "path";

export interface CodeFile {
  path: string;
  content: string;
  lines: number;
}

const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".vscode",
  ".idea",
  "*.log",
  "*.min.js",
  "*.min.css",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx",  // JavaScript/TypeScript
  ".py", ".pyw",                 // Python
  ".java",                       // Java
  ".php", ".phtml",              // PHP
  ".go",                         // Go
  ".rb",                         // Ruby
  ".cs",                         // C#
  ".cpp", ".c", ".h",            // C/C++
  ".swift",                      // Swift
  ".kt", ".kts",                 // Kotlin
  ".rs",                         // Rust
  ".vue",                       // Vue
  ".svelte",                    // Svelte
];

function shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
  const fileName = path.basename(filePath);
  const relativePath = filePath;

  for (const pattern of ignorePatterns) {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      if (regex.test(fileName) || regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath.includes(pattern) || fileName === pattern) {
      return true;
    }
  }
  return false;
}

function hasCodeExtension(filePath: string): boolean {
  return CODE_EXTENSIONS.some(ext => filePath.endsWith(ext));
}

export function collectFiles(
  directory: string,
  ignorePatterns: string[] = DEFAULT_IGNORE
): CodeFile[] {
  const files: CodeFile[] = [];

  function walk(dir: string, baseDir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (shouldIgnore(relativePath, ignorePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath, baseDir);
        } else if (entry.isFile() && hasCodeExtension(entry.name)) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            files.push({
              path: relativePath,
              content: content,
              lines: content.split("\n").length,
            });
          } catch (error) {
            // Skip files that can't be read
            console.warn(`Warning: Could not read file ${relativePath}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}`);
    }
  }

  const absolutePath = path.resolve(directory);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  walk(absolutePath, absolutePath);
  return files;
}
