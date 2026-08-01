/**
 * Sanitizer
 * CRITICAL: Removes ALL sensitive data before output
 * This is NON-NEGOTIABLE for security
 */

import { Blueprint, ParsedFile } from './types';

/**
 * Sanitizes blueprint to ensure NO sensitive data is included
 * This function is the security layer that prevents code leakage
 */
export function sanitizeBlueprint(blueprint: Blueprint): Blueprint {
  // Return a clean copy with only safe metadata
  return {
    meta: {
      ...blueprint.meta,
      // Remove absolute paths
      projectPath: '<sanitized>',
    },
    structure: sanitizeStructure(blueprint.structure),
    dependencies: {
      nodes: blueprint.dependencies.nodes.map(node => ({
        ...node,
        // Keep only relative paths and types
        id: node.id,
        type: node.type,
        path: node.path,
        extension: node.extension,
      })),
      edges: blueprint.dependencies.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        type: edge.type,
      })),
    },
    functions: blueprint.functions.map(func => ({
      name: func.name,
      file: func.file,
      type: func.type,
      exported: func.exported,
      // NO function body, parameters, or implementation details
    })),
    flows: blueprint.flows.map(flow => ({
      from: flow.from,
      to: flow.to,
      file: flow.file,
      type: flow.type,
    })),
    riskSurface: blueprint.riskSurface.map(risk => ({
      file: risk.file,
      tags: risk.tags,
      score: risk.score,
      reasons: risk.reasons, // Generic reasons only
    })),
    entryPoints: blueprint.entryPoints.map(entry => ({
      type: entry.type,
      file: entry.file,
      name: entry.name,
      method: entry.method,
      path: entry.path ? '<path>' : undefined, // Sanitize actual route paths
    })),
    externalCalls: blueprint.externalCalls.map(call => ({
      type: call.type,
      file: call.file,
      function: call.function,
      // NO target URLs, database strings, or connection details
      target: call.target ? '<target>' : undefined,
    })),
    hotspots: blueprint.hotspots?.map(hotspot => ({
      file: hotspot.file,
      connections: hotspot.connections,
      complexity: hotspot.complexity,
      riskScore: hotspot.riskScore,
    })),
    circularDeps: blueprint.circularDeps?.map(cycle => [...cycle]),
  };
}

function sanitizeStructure(node: any): any {
  return {
    name: node.name,
    type: node.type,
    path: node.path,
    size: node.size,
    children: node.children?.map(sanitizeStructure),
  };
}

/**
 * Validates that a blueprint contains NO sensitive data
 * Returns array of violations if any found
 * 
 * Context-aware validation:
 * - "validatePassword" (function name) = SAFE ✅
 * - "password":"abc123" (value) = UNSAFE ❌
 * - "src/auth/token.ts" (file path) = SAFE ✅
 * - "token":"Bearer xyz" (value) = UNSAFE ❌
 */
export function validateSanitization(blueprint: Blueprint): string[] {
  const violations: string[] = [];
  const jsonStr = JSON.stringify(blueprint);

  // 1. Check for function bodies (actual code)
  if (/function\s*\([^)]*\)\s*{[\s\S]{10,}/.test(jsonStr)) {
    violations.push('Found function definition with body - code leak detected');
  }

  // 2. Check for arrow function bodies with substantial code
  if (/=>\s*{[\s\S]{30,}/.test(jsonStr)) {
    violations.push('Found arrow function with body - code leak detected');
  }

  // 3. Check for console statements WITH content
  if (/console\.(log|error|warn)\s*\([^)]+\)/.test(jsonStr)) {
    violations.push('Found console statement with content - code leak detected');
  }

  // 4. Check for actual require/import WITH module paths
  if (/require\s*\(\s*["'][^"']+["']\s*\)/.test(jsonStr)) {
    violations.push('Found require statement with module path - code leak detected');
  }
  if (/import\s+{[^}]+}\s+from\s+["'][^"']+["']/.test(jsonStr)) {
    violations.push('Found import statement with module path - code leak detected');
  }

  // 5. Check for .env file CONTENT (not just filename)
  if (/["']\.env["']\s*[,:]/.test(jsonStr) && !/["']\.env["']\s*}/.test(jsonStr)) {
    violations.push('Found .env reference in suspicious context');
  }

  // 6. Context-aware sensitive data detection
  // Only flag if sensitive words appear as VALUES, not as identifiers
  const contextAwarePatterns = [
    {
      pattern: /"password"\s*:\s*"[^"]+"/i,
      message: 'Found password as a value (not just a function/file name)'
    },
    {
      pattern: /"secret"\s*:\s*"[^"]+"/i,
      message: 'Found secret as a value (not just a function/file name)'
    },
    {
      pattern: /"api[_-]?key"\s*:\s*"[^"]+"/i,
      message: 'Found API key as a value (not just a function/file name)'
    },
    {
      pattern: /"token"\s*:\s*"[^"]+"/i,
      message: 'Found token as a value (not just a function/file name)'
    },
    {
      pattern: /"bearer\s+[a-zA-Z0-9_-]+"/i,
      message: 'Found Bearer token value'
    },
  ];

  for (const { pattern, message } of contextAwarePatterns) {
    if (pattern.test(jsonStr)) {
      violations.push(message);
    }
  }

  // 7. Check for actual connection strings (not just protocol mentions)
  const connectionStringPatterns = [
    /mongodb:\/\/[^\s"]+@[^\s"]+/,
    /postgres:\/\/[^\s"]+@[^\s"]+/,
    /mysql:\/\/[^\s"]+@[^\s"]+/,
  ];

  for (const pattern of connectionStringPatterns) {
    if (pattern.test(jsonStr)) {
      violations.push('Found database connection string with credentials');
    }
  }

  // 8. Check for full URLs (not just protocol or domain names in paths)
  const fullUrlPattern = /https?:\/\/[a-z0-9][a-z0-9.-]{5,}\.[a-z]{2,}[^\s"]{5,}/i;
  if (fullUrlPattern.test(jsonStr)) {
    violations.push('Found full URL - should be sanitized to <target>');
  }

  // 9. Check for API keys by pattern (Stripe, AWS, etc.)
  const apiKeyPatterns = [
    /"(sk|pk)_[a-z]+_[A-Za-z0-9]{20,}"/,  // Stripe
    /"AKIA[A-Z0-9]{16}"/,                 // AWS
    /"AIza[A-Za-z0-9_-]{35}"/,            // Google
  ];

  for (const pattern of apiKeyPatterns) {
    if (pattern.test(jsonStr)) {
      violations.push('Found API key pattern (Stripe/AWS/Google) - actual key value detected');
    }
  }

  // 10. Check for suspiciously long strings (likely code)
  const longStrings = jsonStr.match(/"[^"]{300,}"/g);
  if (longStrings && longStrings.length > 0) {
    violations.push(`Found ${longStrings.length} suspiciously long string(s) (300+ chars) - possible code leak`);
  }

  // 11. Check for SQL queries (actual queries, not just "query" function names)
  if (/["'](SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s+/i.test(jsonStr)) {
    violations.push('Found SQL query text - code leak detected');
  }

  // 12. Check for code comments (should never be in blueprint)
  if (/(\/\/|\/\*|\*\/)/.test(jsonStr)) {
    violations.push('Found code comments - code leak detected');
  }

  return violations;
}

/**
 * Safe export for AI context
 * Produces minimal, structure-only JSON
 */
export function exportForAI(blueprint: Blueprint): string {
  const sanitized = sanitizeBlueprint(blueprint);
  
  // Validate before export
  const violations = validateSanitization(sanitized);
  if (violations.length > 0) {
    console.error('⚠️  SANITIZATION VIOLATIONS DETECTED:');
    violations.forEach(v => console.error(`   - ${v}`));
    throw new Error('Blueprint failed sanitization check - will not export');
  }

  return JSON.stringify(sanitized, null, 2);
}
