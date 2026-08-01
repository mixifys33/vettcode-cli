/**
 * Dependency Builder
 * Constructs dependency graph from parsed files
 */

import * as path from 'path';
import { ParsedFile, DependencyGraph, DependencyNode, DependencyEdge } from './types';

export function buildDependencyGraph(parsedFiles: ParsedFile[], projectRoot: string): DependencyGraph {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const nodeMap = new Map<string, DependencyNode>();

  // Create nodes for all files
  for (const file of parsedFiles) {
    const node: DependencyNode = {
      id: file.relativePath,
      type: 'file',
      path: file.relativePath,
      extension: file.extension,
    };
    nodes.push(node);
    nodeMap.set(file.relativePath, node);
  }

  // Create edges from imports
  for (const file of parsedFiles) {
    for (const imp of file.imports) {
      const targetPath = resolveImport(imp, file.relativePath, projectRoot);
      
      if (targetPath && nodeMap.has(targetPath)) {
        edges.push({
          from: file.relativePath,
          to: targetPath,
          type: imp.startsWith('.')  ? 'import' : 'require',
        });
      }
    }
  }

  return { nodes, edges };
}

function resolveImport(importPath: string, fromFile: string, projectRoot: string): string | null {
  // Ignore external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  try {
    const fromDir = path.dirname(path.join(projectRoot, fromFile));
    const resolved = path.resolve(fromDir, importPath);
    const relative = path.relative(projectRoot, resolved);

    // Try different extensions
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
    for (const ext of extensions) {
      const withExt = relative + ext;
      // We'll check if this file exists in our parsed files later
      return withExt;
    }

    return relative;
  } catch (error) {
    return null;
  }
}

export function detectCircularDependencies(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart));
      }
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    // Find all edges from this node
    const outgoingEdges = graph.edges.filter(e => e.from === node);
    for (const edge of outgoingEdges) {
      dfs(edge.to, [...path]);
    }

    recursionStack.delete(node);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

export function calculateNodeConnectivity(graph: DependencyGraph): Map<string, number> {
  const connectivity = new Map<string, number>();

  for (const node of graph.nodes) {
    const inDegree = graph.edges.filter(e => e.to === node.id).length;
    const outDegree = graph.edges.filter(e => e.from === node.id).length;
    connectivity.set(node.id, inDegree + outDegree);
  }

  return connectivity;
}
