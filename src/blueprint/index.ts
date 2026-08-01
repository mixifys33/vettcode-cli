/**
 * Blueprint Engine Main Orchestrator
 * Generates non-sensitive architectural model of codebase
 */

import { Blueprint, BlueprintMeta } from './types';
import { scanFiles, getProjectStats } from './fileScanner';
import { parseFiles } from './astParser';
import { buildDependencyGraph, detectCircularDependencies } from './dependencyBuilder';
import { buildStructureTree } from './structureBuilder';
import { analyzeCallFlows } from './flowAnalyzer';
import { mapRiskSurface, identifyHotspots } from './riskMapper';
import { sanitizeBlueprint, validateSanitization } from './sanitizer';

export interface BlueprintOptions {
  ignorePatterns?: string[];
  maxFiles?: number;
  includeHotspots?: boolean;
  includeCircularDeps?: boolean;
}

/**
 * Main function to generate complete blueprint
 * Returns sanitized, AI-safe architectural model
 */
export async function generateBlueprint(
  projectPath: string,
  options: BlueprintOptions = {}
): Promise<Blueprint> {
  const startTime = Date.now();

  console.log('🔍 Blueprint Engine: Starting analysis...');

  // Step 1: File Discovery
  console.log('  📁 Discovering files...');
  const scannedFiles = await scanFiles(projectPath, options.ignorePatterns);
  
  if (options.maxFiles && scannedFiles.length > options.maxFiles) {
    console.log(`  ⚠️  Limiting to ${options.maxFiles} files (found ${scannedFiles.length})`);
    scannedFiles.splice(options.maxFiles);
  }

  const stats = getProjectStats(scannedFiles);
  console.log(`  ✓ Found ${stats.totalFiles} files`);

  // Step 2: AST Parsing
  console.log('  🔬 Parsing AST (no code extraction)...');
  const parsedFiles = await parseFiles(
    scannedFiles.map(f => f.absolutePath),
    projectPath
  );
  console.log(`  ✓ Parsed ${parsedFiles.length} files`);

  // Step 3: Build Structure Tree
  console.log('  🌲 Building structure tree...');
  const structure = buildStructureTree(scannedFiles, projectPath);
  console.log('  ✓ Structure tree built');

  // Step 4: Build Dependency Graph
  console.log('  🔗 Building dependency graph...');
  const dependencies = buildDependencyGraph(parsedFiles, projectPath);
  console.log(`  ✓ Graph: ${dependencies.nodes.length} nodes, ${dependencies.edges.length} edges`);

  // Step 5: Analyze Call Flows
  console.log('  🔄 Analyzing call flows...');
  const flows = analyzeCallFlows(parsedFiles);
  console.log(`  ✓ Found ${flows.length} call flows`);

  // Step 6: Map Risk Surface
  console.log('  ⚠️  Mapping risk surface...');
  const riskSurface = mapRiskSurface(parsedFiles, dependencies);
  console.log(`  ✓ Identified ${riskSurface.length} risk areas`);

  // Step 7: Collect all functions
  const allFunctions = parsedFiles.flatMap(f => f.functions);

  // Step 8: Collect all entry points
  const allEntryPoints = parsedFiles.flatMap(f => f.entryPoints);

  // Step 9: Collect all external calls
  const allExternalCalls = parsedFiles.flatMap(f => f.externalCalls);

  // Optional: Detect circular dependencies
  let circularDeps: string[][] | undefined;
  if (options.includeCircularDeps !== false) {
    console.log('  🔄 Detecting circular dependencies...');
    circularDeps = detectCircularDependencies(dependencies);
    if (circularDeps.length > 0) {
      console.log(`  ⚠️  Found ${circularDeps.length} circular dependency chain(s)`);
    }
  }

  // Optional: Identify hotspots
  let hotspots;
  if (options.includeHotspots !== false) {
    console.log('  🔥 Identifying hotspots...');
    hotspots = identifyHotspots(parsedFiles, dependencies, riskSurface);
    console.log(`  ✓ Found ${hotspots.length} hotspot(s)`);
  }

  // Build meta
  const meta: BlueprintMeta = {
    totalFiles: stats.totalFiles,
    totalModules: parsedFiles.length,
    entryPoints: allEntryPoints.length,
    externalCalls: allExternalCalls.length,
    timestamp: new Date().toISOString(),
    projectPath,
  };

  // Construct blueprint
  const blueprint: Blueprint = {
    meta,
    structure,
    dependencies,
    functions: allFunctions,
    flows,
    riskSurface,
    entryPoints: allEntryPoints,
    externalCalls: allExternalCalls,
    hotspots,
    circularDeps,
  };

  // CRITICAL: Sanitize before returning
  console.log('  🔒 Sanitizing (removing all sensitive data)...');
  const sanitized = sanitizeBlueprint(blueprint);

  // Validate sanitization
  const violations = validateSanitization(sanitized);
  if (violations.length > 0) {
    console.error('  ❌ SANITIZATION FAILED:');
    violations.forEach(v => console.error(`     - ${v}`));
    throw new Error('Blueprint contains sensitive data - will not proceed');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Blueprint generated successfully in ${elapsed}s`);
  console.log(`   - ${meta.totalFiles} files analyzed`);
  console.log(`   - ${allFunctions.length} functions mapped`);
  console.log(`   - ${allEntryPoints.length} entry points detected`);
  console.log(`   - ${riskSurface.length} risk areas identified`);

  return sanitized;
}

/**
 * Quick blueprint for small projects (< 100 files)
 */
export async function generateQuickBlueprint(projectPath: string): Promise<Blueprint> {
  return generateBlueprint(projectPath, {
    maxFiles: 100,
    includeHotspots: false,
    includeCircularDeps: false,
  });
}

/**
 * Deep blueprint for comprehensive analysis
 */
export async function generateDeepBlueprint(projectPath: string): Promise<Blueprint> {
  return generateBlueprint(projectPath, {
    includeHotspots: true,
    includeCircularDeps: true,
  });
}

// Export all types and utilities
export * from './types';
export { sanitizeBlueprint, validateSanitization } from './sanitizer';
