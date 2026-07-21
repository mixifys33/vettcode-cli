/**
 * AI Enrichment Engine
 * Processes issues in batches using OpenRouter free models
 */

import { chatCompletion, parseJsonFromModel } from './openrouter';
import type { EnrichedIssue, IssueFix } from './types/enhanced-report';

const BATCH_SIZE = 5; // Process 5 issues at a time
const FREE_MODELS = [
  'openrouter/free',
  'deepseek/deepseek-chat-v3-0324:free'
];

interface RawIssue {
  id: string;
  title: string;
  severity: string;
  category: string;
  file: string;
  line: number;
  evidence: string;
  mitigation?: string;
}

interface AIExplanation {
  description: string;
  impact: string;
  root_cause: string;
}

interface AIFix {
  summary: string;
  before: string;
  after: string;
  steps?: string[];
}

/**
 * Main enrichment pipeline
 */
export async function enrichIssuesWithAI(
  rawIssues: RawIssue[],
  codeFiles: Map<string, string>,
  onProgress?: (phase: string, pct: number) => void
): Promise<EnrichedIssue[]> {
  const batches = chunkArray(rawIssues, BATCH_SIZE);
  const enriched: EnrichedIssue[] = [];
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const progress = Math.round(((i + 1) / batches.length) * 100);
    
    onProgress?.(`AI enrichment (${i + 1}/${batches.length})`, progress);
    
    try {
      const batchResults = await Promise.all(
        batch.map(issue => enrichSingleIssue(issue, codeFiles))
      );
      enriched.push(...batchResults);
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      // Add fallback enrichment
      enriched.push(...batch.map(issue => createFallbackEnrichment(issue)));
    }
  }
  
  return enriched;
}

/**
 * Enrich a single issue with AI
 */
async function enrichSingleIssue(
  issue: RawIssue,
  codeFiles: Map<string, string>
): Promise<EnrichedIssue> {
  const codeSnippet = extractCodeSnippet(issue.file, issue.line, codeFiles);
  
  // Step 1: Get explanation
  const explanation = await getAIExplanation(issue, codeSnippet);
  
  // Step 2: Get fix
  const fix = await getAIFix(issue, codeSnippet);
  
  // Step 3: Extract data flow
  const flow = extractDataFlow(issue, codeSnippet);
  
  return {
    id: issue.id,
    title: issue.title,
    severity: issue.severity as any,
    category: issue.category,
    file: issue.file,
    line: issue.line,
    
    description: explanation.description,
    impact: explanation.impact,
    root_cause: explanation.root_cause,
    
    fix,
    flow,
    code: {
      snippet: codeSnippet.code,
      highlight_line: issue.line,
      start_line: codeSnippet.start,
      end_line: codeSnippet.end,
    },
    
    tags: generateTags(issue),
    resolved: false,
    pinned: false,
  };
}

/**
 * Get AI explanation for an issue
 */
async function getAIExplanation(
  issue: RawIssue,
  codeSnippet: { code: string; start: number; end: number }
): Promise<AIExplanation> {
  const prompt = buildExplanationPrompt(issue, codeSnippet);
  
  try {
    const response = await chatCompletion(
      [
        {
          role: 'system',
          content: 'You are a senior security engineer. Provide specific, actionable explanations based on the actual code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      FREE_MODELS[0],
      0
    );
    
    const parsed = parseJsonFromModel<AIExplanation>(response.content);
    
    // Verification layer
    if (isGenericResponse(parsed)) {
      throw new Error('Generic response detected');
    }
    
    return parsed;
  } catch (error) {
    // Fallback to structured template
    return {
      description: `${issue.title} detected in ${issue.file} at line ${issue.line}. ${issue.evidence}`,
      impact: determineImpact(issue.severity, issue.category),
      root_cause: issue.evidence || 'Code analysis indicates potential vulnerability.',
    };
  }
}

/**
 * Get AI fix suggestion
 */
async function getAIFix(
  issue: RawIssue,
  codeSnippet: { code: string; start: number; end: number }
): Promise<AIFix> {
  const prompt = buildFixPrompt(issue, codeSnippet);
  
  try {
    const response = await chatCompletion(
      [
        {
          role: 'system',
          content: 'You are a code fix expert. Generate REAL, working fixes with before/after code. NO generic advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      FREE_MODELS[1],
      0
    );
    
    const parsed = parseJsonFromModel<AIFix>(response.content);
    
    // Verification
    if (!parsed.before || !parsed.after || parsed.before === parsed.after) {
      throw new Error('Invalid fix');
    }
    
    if (isGenericFix(parsed)) {
      throw new Error('Generic fix detected');
    }
    
    return parsed;
  } catch (error) {
    // Fallback to mitigation
    return {
      summary: issue.mitigation || generateFallbackFix(issue),
      before: extractVulnerableLine(codeSnippet.code, issue.line - codeSnippet.start),
      after: '// Fixed version - manual review required',
      steps: [
        'Review the vulnerable code',
        'Apply security best practices',
        'Test the fix thoroughly'
      ],
    };
  }
}

/**
 * Build explanation prompt
 */
function buildExplanationPrompt(
  issue: RawIssue,
  codeSnippet: { code: string; start: number; end: number }
): string {
  return `Analyze this security issue:

Issue: ${issue.title}
Severity: ${issue.severity}
Category: ${issue.category}
File: ${issue.file}
Line: ${issue.line}

Code Context:
\`\`\`
${codeSnippet.code}
\`\`\`

Evidence: ${issue.evidence}

Return JSON with:
{
  "description": "Specific explanation based on this code (not generic)",
  "impact": "Real-world consequences of this vulnerability",
  "root_cause": "Technical reason why this code is vulnerable"
}

RULES:
- Be SPECIFIC to the actual code shown
- Explain what makes THIS code vulnerable
- NO generic phrases like "sanitize input" without context
`;
}

/**
 * Build fix prompt
 */
function buildFixPrompt(
  issue: RawIssue,
  codeSnippet: { code: string; start: number; end: number }
): string {
  return `Generate a real fix for this issue:

Issue: ${issue.title}
File: ${issue.file}:${issue.line}

Vulnerable Code:
\`\`\`
${codeSnippet.code}
\`\`\`

Return JSON with:
{
  "summary": "Brief fix description",
  "before": "Extract the EXACT vulnerable code",
  "after": "Show the FIXED version with actual code",
  "steps": ["Step 1", "Step 2"]
}

REQUIREMENTS:
- before MUST be actual code from above
- after MUST be working, fixed code
- NO placeholders like "..." or "add validation here"
- Show REAL function calls, imports if needed
`;
}

/**
 * Extract code snippet with context
 */
function extractCodeSnippet(
  filePath: string,
  line: number,
  codeFiles: Map<string, string>
): { code: string; start: number; end: number } {
  const content = codeFiles.get(filePath);
  if (!content) {
    return { code: '// Code not available', start: line, end: line };
  }
  
  const lines = content.split('\n');
  const contextLines = 5;
  const start = Math.max(0, line - contextLines - 1);
  const end = Math.min(lines.length, line + contextLines);
  
  const snippet = lines.slice(start, end).join('\n');
  
  return {
    code: snippet,
    start: start + 1,
    end,
  };
}

/**
 * Extract data flow from code
 */
function extractDataFlow(
  issue: RawIssue,
  codeSnippet: { code: string }
): string[] {
  // Simple heuristic-based flow extraction
  const flow: string[] = [];
  
  // Look for common patterns
  const patterns = [
    /req\.(body|query|params)\.(\w+)/g,
    /const\s+(\w+)\s*=/g,
    /(\w+)\(/g,
  ];
  
  patterns.forEach(pattern => {
    const matches = codeSnippet.code.matchAll(pattern);
    for (const match of matches) {
      if (match[0] && !flow.includes(match[0])) {
        flow.push(match[0]);
      }
    }
  });
  
  return flow.slice(0, 5); // Limit to 5 steps
}

/**
 * Generate tags for issue
 */
function generateTags(issue: RawIssue): string[] {
  const tags: string[] = [issue.category];
  
  const titleLower = issue.title.toLowerCase();
  if (titleLower.includes('sql')) tags.push('sql', 'database');
  if (titleLower.includes('xss')) tags.push('xss', 'injection');
  if (titleLower.includes('auth')) tags.push('authentication');
  if (titleLower.includes('memory')) tags.push('memory', 'performance');
  if (titleLower.includes('leak')) tags.push('leak');
  
  return [...new Set(tags)];
}

/**
 * Verification: detect generic responses
 */
function isGenericResponse(explanation: AIExplanation): boolean {
  const generic = [
    'sanitize input',
    'validate data',
    'use best practices',
    'follow security guidelines',
  ];
  
  const text = (explanation.description + explanation.impact + explanation.root_cause).toLowerCase();
  return generic.some(phrase => text.includes(phrase) && text.length < 200);
}

/**
 * Verification: detect generic fixes
 */
function isGenericFix(fix: AIFix): boolean {
  if (fix.summary.length < 20) return true;
  if (fix.before.includes('...') || fix.after.includes('...')) return true;
  if (fix.before === fix.after) return true;
  
  const genericPhrases = ['add validation', 'sanitize', 'use library'];
  return genericPhrases.some(phrase => 
    fix.after.toLowerCase().includes(phrase) && fix.after.length < 50
  );
}

/**
 * Create fallback enrichment when AI fails
 */
function createFallbackEnrichment(issue: RawIssue): EnrichedIssue {
  return {
    id: issue.id,
    title: issue.title,
    severity: issue.severity as any,
    category: issue.category,
    file: issue.file,
    line: issue.line,
    
    description: issue.evidence || `${issue.title} detected in ${issue.file}`,
    impact: determineImpact(issue.severity, issue.category),
    root_cause: 'Static analysis detected potential vulnerability.',
    
    fix: {
      summary: issue.mitigation || generateFallbackFix(issue),
      before: '// Vulnerable code',
      after: '// Apply security fix',
    },
    flow: [],
    code: {
      snippet: '// Code snippet unavailable',
      highlight_line: issue.line,
      start_line: issue.line,
      end_line: issue.line,
    },
    
    tags: generateTags(issue),
    resolved: false,
    pinned: false,
  };
}

/**
 * Determine impact based on severity
 */
function determineImpact(severity: string, category: string): string {
  if (severity === 'critical') {
    return 'This vulnerability could lead to complete system compromise, data breach, or service disruption.';
  }
  if (severity === 'high') {
    return 'This issue poses significant security risk and should be addressed immediately.';
  }
  if (severity === 'medium') {
    return 'This vulnerability could be exploited under certain conditions and should be fixed.';
  }
  return 'This issue represents a minor security concern or code quality problem.';
}

/**
 * Generate fallback fix
 */
function generateFallbackFix(issue: RawIssue): string {
  const fixes: Record<string, string> = {
    'sql': 'Use parameterized queries or ORM to prevent SQL injection',
    'xss': 'Sanitize user input and encode output properly',
    'auth': 'Implement proper authentication and authorization checks',
    'memory': 'Review memory allocation and ensure proper cleanup',
  };
  
  for (const [key, fix] of Object.entries(fixes)) {
    if (issue.title.toLowerCase().includes(key)) {
      return fix;
    }
  }
  
  return 'Review the code and apply security best practices';
}

/**
 * Extract vulnerable line from snippet
 */
function extractVulnerableLine(snippet: string, lineIndex: number): string {
  const lines = snippet.split('\n');
  return lines[lineIndex] || lines[0] || '// Line not found';
}

/**
 * Utility: chunk array
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
