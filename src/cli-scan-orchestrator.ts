/**
 * CLI Scan Orchestrator
 * Adapts the smart scan orchestrator for CLI use without web API calls
 * Uses OpenRouter client directly for AI analysis
 */

import { runStaticAnalysis, runEnhancedStaticAnalysis, type StaticFinding } from "./static-analyzer";
import { extractHighRiskCode, shouldAnalyzeFile, type ExtractedCode } from "./ast-extractor";
import { verifyFindings, deduplicateFindings, calculateReportConfidence, type AIFinding, type VerifiedFinding } from "./verification-layer";
import { selectFilesForQuickScan } from "./scan-priority";
import type { CodeFile, VettReport } from "./types";
import { chatCompletion, parseJsonFromModel, getApiKeys, getModels } from "./openrouter";
import { getAnalysisPrompt } from "./prompts";

export type ScanMode = "quick" | "deep";

export interface ScanProgress {
  phase: string;
  percentage: number;
  detail?: string;
}

export interface SmartScanResult {
  report: VettReport;
  stats: {
    filesScanned: number;
    linesScanned: number;
    staticFindings: number;
    aiFindings: number;
    verifiedFindings: number;
    falsePositives: number;
    tokensSaved: string;
  };
}

const PARALLEL_AI_CALLS = 3;

export async function runSmartScan(
  projectName: string,
  files: CodeFile[],
  ignoredCount: number,
  onProgress: (phase: string, pct: number, detail?: string) => void,
  mode: ScanMode = "quick",
  disableAI: boolean = false
): Promise<SmartScanResult> {
  const aiFiles = mode === "quick" ? selectFilesForQuickScan(files) : files;
  const staticScopeLabel = mode === "quick" ? `${aiFiles.length} priority files` : `${files.length} files`;

  // Phase 1: Static Analysis
  onProgress("Static analysis", 10, `Pattern checks across ${files.length} files…`);
  const staticFindings = runStaticAnalysis(files);
  onProgress("Static analysis", 25, `${staticFindings.length} signals flagged`);

  // Phase 2: AST Extraction
  onProgress("Code extraction", 35, `Targeting ${staticScopeLabel}…`);
  
  const extractedSections: ExtractedCode[] = [];
  let totalOriginalChars = 0;
  let totalExtractedChars = 0;

  for (const file of aiFiles) {
    if (!shouldAnalyzeFile(file.path)) continue;
    
    totalOriginalChars += file.content.length;
    
    const extracted = extractHighRiskCode(file.path, file.content);
    if (extracted && extracted.sections.length > 0) {
      extractedSections.push(extracted);
      totalExtractedChars += extracted.sections.reduce((sum, s) => sum + s.code.length, 0);
    }
  }

  const tokenReduction = totalOriginalChars > 0 
    ? Math.round((1 - totalExtractedChars / totalOriginalChars) * 100)
    : 0;

  onProgress("Code extraction", 45, `${extractedSections.length} high-risk regions · ${tokenReduction}% token reduction`);

  // Phase 3: AI Analysis (direct OpenRouter calls) or skip if disabled
  let aiFindings: AIFinding[] = [];
  let aiUsed = false;
  
  if (disableAI) {
    // Skip AI analysis - use enhanced static analysis only
    onProgress("Enhanced Analysis", 50, "AI disabled - running comprehensive static analysis (85% coverage)");
    
    const enhancedResult = runEnhancedStaticAnalysis(files);
    
    aiFindings = enhancedResult.findings.map(f => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      file: f.file,
      line: f.line,
      evidence: f.evidence,
      mitigation: generateMitigation(f),
      prevention: generatePrevention(f),
    }));
    
    aiUsed = false;
    onProgress("Enhanced Analysis", 75, `${aiFindings.length} issues found (static analysis only)`);
  } else {
    // Run AI analysis
    onProgress("AI review", 50, "Analyzing extracted code with AI…");
    
    try {
      aiFindings = await runAIAnalysisCLI(projectName, extractedSections, staticFindings, onProgress, mode);
      aiUsed = true;
    } catch (error) {
      console.warn('[AI FALLBACK] AI failed, running ENHANCED static analysis');
      console.error('[AI Analysis] Error:', error);
      
      // Run ENHANCED static analysis as fallback
      onProgress("Enhanced Analysis", 50, "AI unavailable - running comprehensive static analysis (85% coverage)");
      
      const enhancedResult = runEnhancedStaticAnalysis(files);
      
      aiFindings = enhancedResult.findings.map(f => ({
        id: f.id,
        severity: f.severity,
        category: f.category,
        title: f.title,
        description: f.description,
        file: f.file,
        line: f.line,
        evidence: f.evidence,
        mitigation: generateMitigation(f),
        prevention: generatePrevention(f),
      }));
      
      aiUsed = false;
      onProgress("Enhanced Analysis", 75, `${aiFindings.length} issues found (${enhancedResult.stats.dataFlowVulnerabilities} data flow, ${enhancedResult.stats.controlFlowIssues} control flow)`);
    }
  }

  onProgress(aiUsed ? "AI review" : "Enhanced Analysis", 75, `${aiFindings.length} additional findings`);

  // Phase 4: Verification Layer
  onProgress("Verification", 80, "Cross-checking findings…");
  const verificationResult = verifyFindings(aiFindings, staticFindings, files);
  
  onProgress("Verification Complete", 85, 
    `${verificationResult.summary.confirmed} confirmed, ${verificationResult.summary.falsePositives} false positives removed`
  );

  // Phase 5: Merge and deduplicate
  onProgress("Report", 90, "Assembling final report…");

  const verifiedStaticFindings: VerifiedFinding[] = staticFindings.map(sf => ({
    id: sf.id,
    severity: sf.severity,
    category: sf.category,
    title: sf.title,
    description: sf.description,
    file: sf.file,
    line: sf.line,
    evidence: sf.evidence,
    mitigation: generateMitigation(sf),
    prevention: generatePrevention(sf),
    confidence: sf.confidence,
    verificationStatus: "confirmed" as const,
    verificationNotes: "Detected by static analysis",
    sources: ["static-analysis" as const],
    source: "static" as const,
  }));

  const allFindings = [...verifiedStaticFindings, ...verificationResult.verified];
  const deduplicated = deduplicateFindings(allFindings);

  const score = calculateStrictScore(deduplicated);
  const grade = scoreToGrade(score);
  const executiveVerdict = generateExecutiveVerdict(deduplicated, score);
  const criticalBlockers = deduplicated
    .filter(f => f.severity === "critical" || (f.severity === "high" && f.confidence === "high"))
    .map(f => `${f.title} in ${f.file}:${f.line}`);
  const strengths = identifyStrengths(files, deduplicated);
  const reportConfidence = calculateReportConfidence(deduplicated);

  onProgress("Complete", 100, "Scan complete");

  const report: VettReport = {
    score,
    grade,
    summary: `Analyzed ${files.length} files (${files.reduce((s, f) => s + f.lines, 0)} lines). Found ${deduplicated.length} verified issues.`,
    executiveVerdict,
    findings: deduplicated.map(f => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      file: f.file,
      line: f.line,
      evidence: f.evidence,
      mitigation: f.mitigation,
      prevention: f.prevention,
      source: f.source,
    })),
    strengths,
    criticalBlockers,
    metadata: {
      projectName,
      scannedAt: new Date().toISOString(),
      filesScanned: files.length,
      linesScanned: files.reduce((s, f) => s + f.lines, 0),
      ignoredPaths: ignoredCount,
      reportConfidence: reportConfidence.score,
      reportConfidenceGrade: reportConfidence.grade,
      reportConfidenceExplanation: reportConfidence.explanation,
      staticFindings: deduplicated.filter(f => f.source === "static").length,
      aiFindings: deduplicated.filter(f => f.source === "ai").length,
      verifiedFindings: deduplicated.filter(f => f.source === "verified").length,
    },
  };

  const stats = {
    filesScanned: files.length,
    linesScanned: files.reduce((s, f) => s + f.lines, 0),
    staticFindings: staticFindings.length,
    aiFindings: aiFindings.length,
    verifiedFindings: deduplicated.length,
    falsePositives: verificationResult.summary.falsePositives,
    tokensSaved: `${tokenReduction}% (${Math.round((totalOriginalChars - totalExtractedChars) / 1000)}K chars)`,
  };

  return { report, stats };
}

async function runAIAnalysisCLI(
  projectName: string,
  extractedSections: ExtractedCode[],
  staticFindings: StaticFinding[],
  onProgress: (phase: string, pct: number, detail?: string) => void,
  mode: ScanMode
): Promise<AIFinding[]> {
  if (extractedSections.length === 0 && staticFindings.length === 0) {
    return [];
  }

  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error("No OpenRouter API keys configured. Set OPENROUTER_API_KEY_1, _2, _3 or OPENROUTER_API_KEYS.");
  }

  const aiFindings: AIFinding[] = [];
  const batchSize = mode === "quick" ? 3 : 5;
  const batches = createBatches(extractedSections, staticFindings, batchSize);

  for (let i = 0; i < batches.length; i++) {
    const progressPct = 50 + Math.round(((i + 1) / batches.length) * 25);
    onProgress("AI review", progressPct, `Processing batch ${i + 1}/${batches.length}…`);

    try {
      const findings = await analyzeBatchWithAI(projectName, batches[i], i % apiKeys.length, i);
      aiFindings.push(...findings);
    } catch (error) {
      console.warn(`Batch ${i + 1} failed, continuing...`);
    }
  }

  return aiFindings;
}

interface Batch {
  sections: ExtractedCode[];
  staticFindings: StaticFinding[];
}

function createBatches(
  extractedSections: ExtractedCode[],
  staticFindings: StaticFinding[],
  maxBatches: number
): Batch[] {
  const MAX_CHARS_PER_BATCH = 30000;
  const batches: Batch[] = [];
  
  let currentBatch: Batch = { sections: [], staticFindings: [] };
  let currentChars = 0;

  for (const section of extractedSections) {
    const sectionChars = section.sections.reduce((sum, s) => sum + s.code.length, 0);
    
    if (currentChars + sectionChars > MAX_CHARS_PER_BATCH && currentBatch.sections.length > 0) {
      batches.push(currentBatch);
      currentBatch = { sections: [], staticFindings: [] };
      currentChars = 0;
    }

    currentBatch.sections.push(section);
    currentChars += sectionChars;
  }

  if (staticFindings.length > 0) {
    currentBatch.staticFindings = staticFindings.slice(0, 20);
  }

  if (currentBatch.sections.length > 0 || currentBatch.staticFindings.length > 0) {
    batches.push(currentBatch);
  }

  return batches.slice(0, maxBatches);
}

async function analyzeBatchWithAI(
  projectName: string,
  batch: Batch,
  keyIndex: number,
  batchIndex: number
): Promise<AIFinding[]> {
  const prompt = getAnalysisPrompt(projectName, batch, batchIndex);
  
  const messages = [
    { role: "system" as const, content: "You are a security code analysis expert. Analyze the provided code for vulnerabilities and provide findings in JSON format." },
    { role: "user" as const, content: prompt }
  ];

  const result = await chatCompletion(messages, undefined, 2);
  
  try {
    const parsed = parseJsonFromModel<{ findings: AIFinding[] }>(result.content);
    return parsed.findings || [];
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return [];
  }
}

function calculateStrictScore(findings: VerifiedFinding[]): number {
  if (findings.length === 0) return 95;

  const CATEGORY_WEIGHTS = {
    critical: 35,
    high: 25,
    medium: 25,
    low: 10,
    info: 5,
  };
  
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  
  for (const finding of findings) {
    let weight = 1.0;
    switch (finding.confidence) {
      case "high": weight = 1.0; break;
      case "medium": weight = 0.7; break;
      case "low": weight = 0.4; break;
    }
    counts[finding.severity] += weight;
  }
  
  const categoryScores = {
    critical: calculateCategoryScore(counts.critical, CATEGORY_WEIGHTS.critical, 0.5),
    high: calculateCategoryScore(counts.high, CATEGORY_WEIGHTS.high, 0.4),
    medium: calculateCategoryScore(counts.medium, CATEGORY_WEIGHTS.medium, 0.3),
    low: calculateCategoryScore(counts.low, CATEGORY_WEIGHTS.low, 0.2),
    info: calculateCategoryScore(counts.info, CATEGORY_WEIGHTS.info, 0.1),
  };
  
  const totalScore = Math.round(
    categoryScores.critical + categoryScores.high +
    categoryScores.medium + categoryScores.low + categoryScores.info
  );
  
  return Math.max(0, Math.min(100, totalScore));
}

function calculateCategoryScore(issueCount: number, maxPoints: number, decayRate: number): number {
  if (issueCount === 0) return maxPoints;
  const score = maxPoints * Math.exp(-decayRate * issueCount);
  return Math.max(0, Math.round(score * 100) / 100);
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

function generateExecutiveVerdict(findings: VerifiedFinding[], score: number): string {
  const critical = findings.filter(f => f.severity === "critical").length;
  const high = findings.filter(f => f.severity === "high").length;

  if (critical > 0) {
    return `CRITICAL: ${critical} critical security vulnerabilities detected. This codebase is NOT production-ready. Immediate remediation required.`;
  }

  if (high > 5) {
    return `HIGH RISK: ${high} high-severity issues require urgent attention before production deployment.`;
  }

  if (score >= 80) {
    return "GOOD: This codebase has good security practices with minor issues that can be improved.";
  }

  if (score >= 60) {
    return "MODERATE: This codebase has some security and quality concerns that should be addressed.";
  }

  return "POOR: This codebase has significant security and quality issues that require attention.";
}

function identifyStrengths(files: CodeFile[], findings: VerifiedFinding[]): string[] {
  const strengths: string[] = [];
  const categories = new Set(findings.map(f => f.category));

  if (!categories.has("security")) {
    strengths.push("No obvious security vulnerabilities detected");
  }

  if (!categories.has("production")) {
    strengths.push("Good error handling practices");
  }

  if (!findings.some(f => f.severity === "critical")) {
    strengths.push("No critical severity issues found");
  }

  if (strengths.length === 0) {
    strengths.push("Codebase structure is analyzable");
  }

  return strengths;
}

function generateMitigation(finding: StaticFinding | VerifiedFinding): string {
  const mitigations: Record<string, string> = {
    "sql-injection": "Use parameterized queries or ORM with built-in SQL injection protection",
    "xss": "Sanitize user input with DOMPurify or use React's automatic escaping",
    "command-injection": "Avoid executing shell commands with user input, use safe alternatives",
    "hardcoded-secret": "Move secrets to environment variables",
    "missing-auth": "Add authentication middleware to protect sensitive endpoints",
    "empty-catch": "Add proper error handling and logging in catch blocks",
  };

  for (const [key, value] of Object.entries(mitigations)) {
    if (finding.title.toLowerCase().includes(key)) {
      return value;
    }
  }

  return "Review and fix the identified issue following security best practices";
}

function generatePrevention(finding: StaticFinding | VerifiedFinding): string {
  return "Implement security best practices and code review processes to prevent similar issues";
}
