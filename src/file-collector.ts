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
  // Dependencies
  "node_modules",
  "vendor",
  "bower_components",
  "jspm_packages",
  
  // Build outputs
  "dist",
  "build",
  "out",
  ".next",
  ".nuxt",
  ".output",
  ".vercel",
  ".netlify",
  
  // Version control
  ".git",
  ".svn",
  ".hg",
  
  // IDE/Editor
  ".vscode",
  ".idea",
  ".eclipse",
  ".settings",
  "*.swp",
  "*.swo",
  "*~",
  
  // Coverage and test artifacts
  "coverage",
  ".nyc_output",
  "test-results",
  "__pycache__",
  "*.pyc",
  "*.pyo",
  ".pytest_cache",
  
  // Cache and temp
  ".cache",
  ".tmp",
  "tmp",
  "temp",
  ".temp",
  
  // Logs
  "logs",
  "*.log",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  
  // Lock files
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Gemfile.lock",
  "Cargo.lock",
  
  // Minified files
  "*.min.js",
  "*.min.css",
  "*.bundle.js",
  
  // OS files
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  
  // Environment and secrets
  ".env",
  ".env.local",
  ".env.*.local",
  
  // Reports (VettCode's own reports)
  ".vettcode-reports",
];

const CODE_EXTENSIONS = [
  // JavaScript/TypeScript
  ".js", ".jsx", ".mjs", ".cjs",
  ".ts", ".tsx", ".mts", ".cts",
  
  // Python
  ".py", ".pyw", ".pyx",
  
  // Java/JVM
  ".java", ".kt", ".kts", ".scala", ".groovy",
  
  // PHP
  ".php", ".phtml", ".php3", ".php4", ".php5",
  
  // Go
  ".go",
  
  // Ruby
  ".rb", ".rake", ".gemspec",
  
  // C#/.NET
  ".cs", ".vb", ".fs",
  
  // C/C++
  ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx",
  
  // Swift
  ".swift",
  
  // Rust
  ".rs",
  
  // Frontend frameworks
  ".vue", ".svelte",
  
  // Shell scripts
  ".sh", ".bash", ".zsh",
  
  // SQL
  ".sql",
  
  // Other languages
  ".dart",      // Dart/Flutter
  ".ex", ".exs", // Elixir
  ".erl",       // Erlang
  ".hs",        // Haskell
  ".lua",       // Lua
  ".r", ".R",   // R
  ".sol",       // Solidity
  ".m",         // Objective-C
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
