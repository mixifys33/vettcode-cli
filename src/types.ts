export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "security"
  | "production"
  | "typing"
  | "logic"
  | "database"
  | "performance"
  | "reliability"
  | "configuration"
  | "code-quality"
  | "react"
  | "other";

export interface Finding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidence?: string;
  mitigation: string;
  prevention: string;
  source?: "static" | "ai" | "verified" | "scanner";
}

export interface CodeFile {
  path: string;
  content: string;
  lines: number;
}

export interface VettReport {
  score: number;
  grade: string;
  summary: string;
  executiveVerdict: string;
  findings: Finding[];
  strengths: string[];
  criticalBlockers: string[];
  metadata?: {
    projectName: string;
    scannedAt: string;
    filesScanned: number;
    linesScanned: number;
    ignoredPaths: number;
    reportConfidence?: number;
    reportConfidenceGrade?: string;
    reportConfidenceExplanation?: string;
    staticFindings?: number;
    aiFindings?: number;
    verifiedFindings?: number;
  };
}
