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
  if (findings.length === 0) return 100;

  let score = 100;
  const severityWeights = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 1,
  };

  for (const finding of findings) {
    score -= severityWeights[finding.severity];
  }

  return Math.max(0, score);
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
    return `CRITICAL: This codebase has ${criticalCount} critical security vulnerability(ies) that must be fixed immediately before production deployment.`;
  }

  if (highCount > 3) {
    return `HIGH RISK: This codebase has ${highCount} high-severity issues that should be addressed before production.`;
  }

  if (score >= 80) {
    return "GOOD: This codebase has good security practices with minor issues that can be improved.";
  }

  if (score >= 60) {
    return "MODERATE: This codebase has some security and quality concerns that should be addressed.";
  }

  return "POOR: This codebase has significant security and quality issues that require attention.";
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
