# Blueprint Engine

## Overview

The Blueprint Engine is a **NON-AI** architectural analysis system that generates a sanitized, structural representation of a codebase. It provides the AI assistant with rich context about project architecture WITHOUT exposing source code or secrets.

## Purpose

When users ask the AI assistant questions about their security report, the AI needs context about:

- How the project is structured
- Where the entry points are (API routes, controllers)
- Which files handle sensitive operations (auth, database, payments)
- How components are connected
- Which areas are most complex/risky

Traditional approaches would require sending actual source code to the AI, which poses security risks. The Blueprint Engine solves this by extracting **only metadata** - function names, file relationships, call flows, etc.

## Architecture

```
/blueprint
  ├── types.ts              # TypeScript interfaces for all data structures
  ├── fileScanner.ts        # Discovers files (respects .gitignore patterns)
  ├── astParser.ts          # Extracts structure from AST (NO code content)
  ├── dependencyBuilder.ts  # Builds file dependency graph
  ├── structureBuilder.ts   # Creates hierarchical project tree
  ├── flowAnalyzer.ts       # Maps function → function call relationships
  ├── riskMapper.ts         # Identifies high-risk areas by patterns
  ├── sanitizer.ts          # CRITICAL: Removes all sensitive data
  └── index.ts              # Main orchestrator
```

## Pipeline

```
1. File Discovery
   └─> Scans project directory
   └─> Ignores node_modules, .git, dist, etc.
   └─> Returns list of .js/.ts/.jsx/.tsx files

2. AST Parsing (TypeScript Compiler API)
   └─> Parses each file into Abstract Syntax Tree
   └─> Extracts: imports, exports, functions, calls
   └─> Detects: entry points (routes), external calls (DB, HTTP)
   └─> NO CODE BODIES are extracted

3. Dependency Graph
   └─> Builds nodes (files) and edges (imports)
   └─> Detects circular dependencies
   └─> Calculates connectivity metrics

4. Structure Tree
   └─> Creates hierarchical folder/file tree
   └─> Sorted: directories first, then alphabetically

5. Call Flow Analysis
   └─> Maps function → function call relationships
   └─> Builds call chains

6. Risk Surface Mapping
   └─> Identifies sensitive files (auth, payment, database)
   └─> Scores risk based on patterns and connectivity
   └─> Marks entry points and external calls

7. Sanitization (MANDATORY)
   └─> Removes ALL code content
   └─> Removes absolute paths
   └─> Removes connection strings/URLs
   └─> Validates NO sensitive patterns remain
   └─> THROWS ERROR if violations found
```

## Output Format

```json
{
  "meta": {
    "totalFiles": 247,
    "totalModules": 247,
    "entryPoints": 12,
    "externalCalls": 45,
    "timestamp": "2026-08-01T10:30:00.000Z",
    "projectPath": "<sanitized>"
  },
  "structure": {
    "name": "project-root",
    "type": "directory",
    "children": [...]
  },
  "dependencies": {
    "nodes": [
      { "id": "src/auth.ts", "type": "file", "path": "src/auth.ts", "extension": ".ts" }
    ],
    "edges": [
      { "from": "src/api.ts", "to": "src/auth.ts", "type": "import" }
    ]
  },
  "functions": [
    { "name": "loginUser", "file": "src/auth.ts", "type": "async", "exported": true }
  ],
  "flows": [
    { "from": "loginUser", "to": "validatePassword", "file": "src/auth.ts", "type": "direct" }
  ],
  "riskSurface": [
    {
      "file": "src/auth.ts",
      "tags": ["entry", "auth", "database"],
      "score": 85,
      "reasons": ["2 entry point(s)", "Sensitive: auth", "15 dependencies"]
    }
  ],
  "entryPoints": [
    { "type": "route", "file": "src/api/login.ts", "name": "post", "method": "POST" }
  ],
  "externalCalls": [
    { "type": "database", "file": "src/auth.ts", "function": "query" }
  ],
  "hotspots": [
    { "file": "src/auth.ts", "connections": 15, "complexity": 42, "riskScore": 127 }
  ],
  "circularDeps": [
    ["src/a.ts", "src/b.ts", "src/a.ts"]
  ]
}
```

## Security Guarantees

### ✅ What IS Included

- File names and paths (relative)
- Function names only
- Import/export relationships
- Structural metadata
- Pattern-based risk scores

### ❌ What is NEVER Included

- Function bodies or implementations
- Variable values
- Strings or literals
- Code snippets
- Passwords, API keys, secrets
- Database connection strings
- Full URLs
- Comments or documentation

### Sanitization Validation

The `sanitizer.ts` module runs a battery of checks:

- Regex patterns for forbidden content (function bodies, credentials, URLs)
- String length checks (suspiciously long strings = possible code leak)
- Throws error if ANY violations found
- **System will refuse to export if sanitization fails**

## Integration

### In Scanner Pipeline

```typescript
// cli-scan-orchestrator.ts
import { generateBlueprint } from "./blueprint";

const blueprint = await generateBlueprint(projectPath, {
  maxFiles: mode === "quick" ? 100 : undefined,
  includeHotspots: mode === "deep",
  includeCircularDeps: mode === "deep",
});

return { report, blueprint, stats };
```

### In Report Upload

```typescript
// cli.ts
const reportData = {
  id: reportId,
  projectName,
  ...report,
  blueprint, // ← Included in upload
  createdAt: new Date().toISOString(),
};
```

### In AI Context

```typescript
// app/api/ai-chat/route.ts
function buildReportContext(report) {
  // ... existing report context ...

  if (report.blueprint) {
    const { meta, entryPoints, riskSurface, hotspots } = report.blueprint;

    blueprintContext = `
**Project Architecture:**
- Total Files: ${meta.totalFiles}
- Entry Points: ${meta.entryPoints}
...
`;
  }
}
```

## Usage Examples

### Quick Blueprint (< 100 files)

```typescript
const blueprint = await generateQuickBlueprint("/path/to/project");
```

### Deep Blueprint (all files + circular deps)

```typescript
const blueprint = await generateDeepBlueprint("/path/to/project");
```

### Custom Options

```typescript
const blueprint = await generateBlueprint("/path/to/project", {
  maxFiles: 200,
  ignorePatterns: ["node_modules", "dist", "test"],
  includeHotspots: true,
  includeCircularDeps: true,
});
```

## Performance

- **1000+ files**: ~5-10 seconds
- **Non-blocking**: Uses async processing
- **Cached ASTs**: Reuses parsed results where possible
- **Optimized**: Only processes relevant file types

## Benefits for AI Assistant

With the blueprint, the AI can now:

1. **Understand Context**: "The auth system has 3 entry points and connects to 12 other modules"
2. **Target Advice**: "Focus on `src/auth.ts` - it's a hotspot with high connectivity"
3. **Prioritize Fixes**: "Start with entry points in the payment flow"
4. **Explain Architecture**: "Your API layer talks directly to the database without a service layer"
5. **Identify Patterns**: "You have 5 circular dependencies that could cause issues"

## Error Handling

- **File scan fails**: Logs error, continues with other files
- **AST parse fails**: Logs error, skips that file
- **Blueprint generation fails**: Scan continues without blueprint (optional)
- **Sanitization fails**: Throws error, refuses to export

## Maintenance

### Adding New Risk Patterns

Edit `riskMapper.ts`:

```typescript
const SENSITIVE_PATTERNS = {
  auth: ["login", "password", "token"],
  payment: ["stripe", "paypal", "checkout"],
  // Add new category:
  crypto: ["encrypt", "decrypt", "hash"],
};
```

### Supporting New File Types

Edit `fileScanner.ts`:

```typescript
const SUPPORTED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py", // Add Python support
];
```

### Adjusting Sanitization Rules

Edit `sanitizer.ts`:

```typescript
const forbiddenPatterns = [/function\s*\(/, /your-new-pattern/];
```

## Testing

To verify blueprint is working:

```bash
# Run a scan
vettcode . --mode deep --verbose

# Check for blueprint in output
# Look for: "Blueprint: Mapping project architecture..."
# Should see: "Architecture mapped: X files"
```

To verify sanitization:

```typescript
import { validateSanitization } from "./blueprint/sanitizer";

const violations = validateSanitization(blueprint);
console.log(violations); // Should be empty array []
```

## Future Enhancements

- [ ] Support for Python, Java, Go, Rust
- [ ] Data flow analysis (without code exposure)
- [ ] API endpoint documentation extraction
- [ ] Database schema detection
- [ ] Framework-specific patterns (Next.js, Express, Django)
- [ ] Visual graph generation for web UI
- [ ] Blueprint diff for tracking changes over time
