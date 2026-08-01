/**
 * Risk Mapper
 * Identifies high-risk areas of the codebase
 */

import { ParsedFile, RiskSurfaceItem, HotspotInfo, DependencyGraph } from './types';
import { calculateNodeConnectivity } from './dependencyBuilder';

const SENSITIVE_PATTERNS = {
  auth: ['login', 'signup', 'register', 'password', 'token', 'session', 'authenticate'],
  payment: ['payment', 'checkout', 'charge', 'transaction', 'billing', 'stripe', 'paypal'],
  database: ['query', 'execute', 'db', 'database', 'sql', 'mongo', 'prisma', 'orm'],
  sensitive: ['secret', 'key', 'credential', 'private', 'sensitive', 'config'],
  external: ['fetch', 'axios', 'request', 'http', 'api'],
};

export function mapRiskSurface(parsedFiles: ParsedFile[], graph: DependencyGraph): RiskSurfaceItem[] {
  const riskItems: RiskSurfaceItem[] = [];
  const connectivity = calculateNodeConnectivity(graph);

  for (const file of parsedFiles) {
    const tags: string[] = [];
    const reasons: string[] = [];
    let score = 0;

    // Check for entry points
    if (file.entryPoints.length > 0) {
      tags.push('entry');
      score += 20;
      reasons.push(`${file.entryPoints.length} entry point(s)`);
    }

    // Check for external calls
    if (file.externalCalls.length > 0) {
      tags.push('external');
      score += 15;
      reasons.push(`${file.externalCalls.length} external call(s)`);
    }

    // Check for sensitive patterns in filename
    const lowerPath = file.relativePath.toLowerCase();
    for (const [category, patterns] of Object.entries(SENSITIVE_PATTERNS)) {
      if (patterns.some(p => lowerPath.includes(p))) {
        tags.push(category);
        score += 25;
        reasons.push(`Sensitive: ${category}`);
      }
    }

    // Check for sensitive patterns in function names
    for (const func of file.functions) {
      const lowerFunc = func.name.toLowerCase();
      for (const [category, patterns] of Object.entries(SENSITIVE_PATTERNS)) {
        if (patterns.some(p => lowerFunc.includes(p))) {
          if (!tags.includes(category)) {
            tags.push(category);
            score += 10;
          }
        }
      }
    }

    // High connectivity = high risk
    const connections = connectivity.get(file.relativePath) || 0;
    if (connections > 10) {
      tags.push('highly-connected');
      score += Math.min(connections, 30);
      reasons.push(`${connections} dependencies`);
    }

    // Only include files with some risk
    if (score > 0) {
      riskItems.push({
        file: file.relativePath,
        tags: [...new Set(tags)],
        score,
        reasons,
      });
    }
  }

  // Sort by score descending
  return riskItems.sort((a, b) => b.score - a.score);
}

export function identifyHotspots(
  parsedFiles: ParsedFile[],
  graph: DependencyGraph,
  riskSurface: RiskSurfaceItem[]
): HotspotInfo[] {
  const connectivity = calculateNodeConnectivity(graph);
  const hotspots: HotspotInfo[] = [];

  for (const file of parsedFiles) {
    const connections = connectivity.get(file.relativePath) || 0;
    const complexity = file.functions.length + file.calls.length;
    const riskItem = riskSurface.find(r => r.file === file.relativePath);
    const riskScore = riskItem?.score || 0;

    // Calculate hotspot score
    const hotspotScore = (connections * 2) + complexity + riskScore;

    if (hotspotScore > 50) {
      hotspots.push({
        file: file.relativePath,
        connections,
        complexity,
        riskScore: hotspotScore,
      });
    }
  }

  return hotspots.sort((a, b) => b.riskScore - a.riskScore);
}
