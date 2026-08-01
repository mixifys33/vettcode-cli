/**
 * File Scanner
 * Discovers all relevant files in the project
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'out',
  'coverage',
  '.vettcode-reports',
  '__pycache__',
  'venv',
  '.env',
  '*.min.js',
  '*.bundle.js',
];

const SUPPORTED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
];

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  extension: string;
  size: number;
}

export async function scanFiles(
  projectPath: string,
  ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS
): Promise<ScannedFile[]> {
  const files: ScannedFile[] = [];

  function shouldIgnore(filePath: string): boolean {
    const relativePath = path.relative(projectPath, filePath);
    return ignorePatterns.some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  function scanDirectory(dirPath: string): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (shouldIgnore(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            const stats = fs.statSync(fullPath);
            files.push({
              absolutePath: fullPath,
              relativePath: path.relative(projectPath, fullPath),
              extension: ext,
              size: stats.size,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  scanDirectory(projectPath);
  return files;
}

export function getProjectStats(files: ScannedFile[]) {
  return {
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    byExtension: files.reduce((acc, f) => {
      acc[f.extension] = (acc[f.extension] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
