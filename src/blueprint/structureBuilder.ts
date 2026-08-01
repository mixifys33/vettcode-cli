/**
 * Structure Builder
 * Creates hierarchical tree of project structure
 */

import * as path from 'path';
import { StructureNode } from './types';
import { ScannedFile } from './fileScanner';

export function buildStructureTree(files: ScannedFile[], projectRoot: string): StructureNode {
  const root: StructureNode = {
    name: path.basename(projectRoot),
    type: 'directory',
    path: '',
    children: [],
  };

  for (const file of files) {
    const parts = file.relativePath.split(path.sep);
    let current = root;

    // Navigate/create directory structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let child = current.children?.find(c => c.name === part && c.type === 'directory');
      
      if (!child) {
        child = {
          name: part,
          type: 'directory',
          path: parts.slice(0, i + 1).join('/'),
          children: [],
        };
        current.children = current.children || [];
        current.children.push(child);
      }
      
      current = child;
    }

    // Add file node
    const fileName = parts[parts.length - 1];
    current.children = current.children || [];
    current.children.push({
      name: fileName,
      type: 'file',
      path: file.relativePath,
      size: file.size,
    });
  }

  // Sort children (directories first, then alphabetically)
  sortStructure(root);
  
  return root;
}

function sortStructure(node: StructureNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    // Directories before files
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Alphabetical
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  for (const child of node.children) {
    if (child.type === 'directory') {
      sortStructure(child);
    }
  }
}

export function flattenStructure(node: StructureNode, depth: number = 0): string[] {
  const result: string[] = [];
  const indent = '  '.repeat(depth);
  
  const icon = node.type === 'directory' ? '📁' : '📄';
  result.push(`${indent}${icon} ${node.name}`);

  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenStructure(child, depth + 1));
    }
  }

  return result;
}
