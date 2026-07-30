/**
 * Report Generator - Generates security reports from findings
 */

import type { Finding, VettReport } from "./types";
import type { StaticFinding } from "./static-analyzer";

export function generateReport(
  staticFindings: StaticFinding[],
  filesScanned: number,
  linesScanned: number,
  projectName: string
): VettReport {
  // Convert static findings to findings
  const findings: Finding[] = staticFindings.map(f => ({
    id: f.id,
    severity: f.severity,
    category: f.category,
    title: f.title,
    description: f.description,
    file: f.file,
    line: f.line,
    evidence: f.evidence,
    mitigation: "",
    prevention: "",
    source: "static",
  }));

  // Calculate score
  const score = calculateScore(findings);
  const grade = calculateGrade(score);

  // Generate summary
  const summary = `Analyzed ${filesScanned} files (${linesScanned} lines). Found ${findings.length} issues.`;

  // Generate executive verdict
  const executiveVerdict = generateExecutiveVerdict(score, findings);

  // Extract critical blockers
  const criticalBlockers = findings
    .filter(f => f.severity === "critical")
    .map(f => `${f.title} in ${f.file}:${f.line}`);

  // Generate strengths
  const strengths = generateStrengths(findings);

  return {
    score,
    grade,
    summary,
    executiveVerdict,
    findings,
    strengths,
    criticalBlockers,
    metadata: {
      projectName,
      scannedAt: new Date().toISOString(),
      filesScanned,
      linesScanned,
      ignoredPaths: 0,
    },
  };
}

function calculateScore(findings: Finding[]): number {
  if (findings.length === 0) return 95; // Not perfect, might have missed issues

  // Weighted category-based scoring system
  // Each severity has its own "bucket" that can be depleted independently
  // This prevents info/low errors from tanking the entire score
  
  const CATEGORY_WEIGHTS = {
    critical: 35,  // 35% of total score
    high: 25,      // 25% of total score (Critical + High = 60%)
    medium: 25,    // 25% of total score
    low: 10,       // 10% of total score
    info: 5,       // 5% of total score
  };
  
  // Count findings by severity
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }
  
  // Calculate score for each category
  // Each category depletes independently based on issue count
  const categoryScores = {
    critical: calculateCategoryScore(counts.critical, CATEGORY_WEIGHTS.critical, 0.5), // 0.5 = aggressive penalty
    high: calculateCategoryScore(counts.high, CATEGORY_WEIGHTS.high, 0.4),
    medium: calculateCategoryScore(counts.medium, CATEGORY_WEIGHTS.medium, 0.3),
    low: calculateCategoryScore(counts.low, CATEGORY_WEIGHTS.low, 0.2),
    info: calculateCategoryScore(counts.info, CATEGORY_WEIGHTS.info, 0.1), // 0.1 = gentle penalty
  };
  
  // Sum up all category scores
  const totalScore = Math.round(
    categoryScores.critical +
    categoryScores.high +
    categoryScores.medium +
    categoryScores.low +
    categoryScores.info
  );
  
  return Math.max(0, Math.min(100, totalScore));
}

/**
 * Calculate score for a single category using logarithmic decay
 * This prevents a single category from being completely destroyed by many issues
 * 
 * @param issueCount - Number of issues
 * @param maxPoints - Maximum points for this category
 * @param decayRate - How fast the score decays (higher = faster decay)
 */
function calculateCategoryScore(issueCount: number, maxPoints: number, decayRate: number): number {
  if (issueCount === 0) return maxPoints;
  
  // Logarithmic decay formula: score = maxPoints * e^(-decayRate * issueCount)
  // This means:
  // - First few issues hurt a lot
  // - Additional issues hurt less and less
  // - Score approaches 0 but never quite reaches it (unless many issues)
  
  const score = maxPoints * Math.exp(-decayRate * issueCount);
  
  // Round to 2 decimal places for precision
  return Math.max(0, Math.round(score * 100) / 100);
}

function calculateGrade(score: number): string {
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

function generateExecutiveVerdict(score: number, findings: Finding[]): string {
  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const highCount = findings.filter(f => f.severity === "high").length;

  if (criticalCount > 0) {
    return `CRITICAL: ${criticalCount} critical security vulnerabilities detected. This codebase is NOT production-ready and poses immediate security risks. ${highCount > 0 ? `Additionally, ${highCount} high-severity issues require urgent attention.` : ""} Immediate remediation required before any deployment.`;
  }

  if (highCount > 3) {
    return `HIGH RISK: This codebase has ${highCount} high-severity issues that should be addressed before production. While not immediately critical, these issues pose significant risks to security, stability, or data integrity.`;
  }

  if (score >= 80) {
    return `GOOD: This codebase demonstrates solid engineering practices with ${findings.length} minor issues identified. The code is production-ready with recommended improvements for enhanced security and maintainability. Continue monitoring and addressing findings during regular maintenance cycles.`;
  }

  if (score >= 60) {
    return `MODERATE: This codebase has ${findings.length} issues spanning security, code quality, and reliability concerns. While functional, it requires attention to several areas before being considered production-hardened. Prioritize high and medium severity findings.`;
  }

  return `POOR: This codebase has significant security and quality issues (${findings.length} findings) that require immediate attention. Not recommended for production use until critical and high-severity issues are resolved. Consider code review and refactoring for affected areas.`;
}

function generateStrengths(findings: Finding[]): string[] {
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
