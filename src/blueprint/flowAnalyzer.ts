/**
 * Flow Analyzer
 * Builds call flow graph (function → function relationships)
 */

import { ParsedFile, CallFlow } from './types';

export function analyzeCallFlows(parsedFiles: ParsedFile[]): CallFlow[] {
  const flows: CallFlow[] = [];
  
  // Build function registry
  const functionRegistry = new Map<string, string>(); // funcName -> file
  for (const file of parsedFiles) {
    for (const func of file.functions) {
      functionRegistry.set(func.name, file.relativePath);
    }
  }

  // Analyze calls
  for (const file of parsedFiles) {
    for (const func of file.functions) {
      // Check if this function calls other functions we know about
      for (const call of file.calls) {
        if (functionRegistry.has(call)) {
          flows.push({
            from: func.name,
            to: call,
            file: file.relativePath,
            type: 'direct',
          });
        }
      }
    }
  }

  return flows;
}

export function buildCallChains(flows: CallFlow[], startFunction: string, maxDepth: number = 5): string[][] {
  const chains: string[][] = [];
  const visited = new Set<string>();

  function dfs(current: string, path: string[], depth: number): void {
    if (depth > maxDepth || visited.has(current)) {
      return;
    }

    visited.add(current);
    path.push(current);

    const outgoingFlows = flows.filter(f => f.from === current);
    
    if (outgoingFlows.length === 0) {
      // Leaf node - save this chain
      chains.push([...path]);
    } else {
      for (const flow of outgoingFlows) {
        dfs(flow.to, [...path], depth + 1);
      }
    }

    visited.delete(current);
  }

  dfs(startFunction, [], 0);
  return chains;
}
