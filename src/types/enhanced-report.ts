/**
 * Enhanced Report Schema
 * Production-grade structured data for interactive reports
 */

export interface EnhancedReport {
  meta: ReportMeta;
  summary: ReportSummary;
  insights: ProjectInsights;
  issues: EnrichedIssue[];
}

export interface ReportMeta {
  project: string;
  scan_mode: 'quick' | 'deep';
  timestamp: number;
  duration_ms: number;
  ai_enabled: boolean;
  files_scanned: number;
  lines_scanned: number;
}

export interface ReportSummary {
  score: number;
  grade: string;
  verdict: string;
  fix_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  severity_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface ProjectInsights {
  top_risk_areas: Array<{
    area: string;
    percentage: number;
    issue_count: number;
  }>;
  most_common_issue: string;
  risk_clusters: string[];
  vulnerability_categories: Record<string, number>;
}

export interface EnrichedIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  file: string;
  line: number;
  
  // AI-enriched fields
  description: string;
  impact: string;
  root_cause: string;
  
  fix: IssueFix;
  flow: string[];
  code: CodeSnippet;
  
  tags: string[];
  resolved?: boolean;
  pinned?: boolean;
}

export interface IssueFix {
  summary: string;
  before: string;
  after: string;
  steps?: string[];
}

export interface CodeSnippet {
  snippet: string;
  highlight_line: number;
  start_line: number;
  end_line: number;
}
