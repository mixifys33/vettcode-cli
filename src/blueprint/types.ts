/**
 * Blueprint Engine Types
 * Non-sensitive architectural model for AI context
 */

export interface BlueprintMeta {
  totalFiles: number;
  totalModules: number;
  entryPoints: number;
  externalCalls: number;
  timestamp: string;
  projectPath: string;
}

export interface DependencyNode {
  id: string;
  type: 'file' | 'module';
  path: string;
  extension?: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic';
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface FunctionInfo {
  name: string;
  file: string;
  type: 'function' | 'method' | 'arrow' | 'async';
  exported: boolean;
}

export interface CallFlow {
  from: string;
  to: string;
  file: string;
  type: 'direct' | 'async' | 'callback';
}

export interface RiskSurfaceItem {
  file: string;
  tags: string[];
  score: number;
  reasons: string[];
}

export interface StructureNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: StructureNode[];
  size?: number;
}

export interface EntryPoint {
  type: 'route' | 'controller' | 'handler' | 'cli';
  file: string;
  name: string;
  method?: string;
  path?: string;
}

export interface ExternalCall {
  type: 'http' | 'database' | 'filesystem' | 'process' | 'network';
  file: string;
  function: string;
  target?: string;
}

export interface Blueprint {
  meta: BlueprintMeta;
  structure: StructureNode;
  dependencies: DependencyGraph;
  functions: FunctionInfo[];
  flows: CallFlow[];
  riskSurface: RiskSurfaceItem[];
  entryPoints: EntryPoint[];
  externalCalls: ExternalCall[];
  hotspots?: HotspotInfo[];
  circularDeps?: string[][];
}

export interface HotspotInfo {
  file: string;
  connections: number;
  complexity: number;
  riskScore: number;
}

export interface ParsedFile {
  path: string;
  relativePath: string;
  extension: string;
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  calls: string[];
  entryPoints: EntryPoint[];
  externalCalls: ExternalCall[];
}
