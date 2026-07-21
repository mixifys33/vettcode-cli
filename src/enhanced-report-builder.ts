/**
 * Enhanced Report Builder
 * Transforms scan results into interactive report format
 */

import type { VettReport } from './types';
import type { EnhancedReport, ProjectInsights, EnrichedIssue } from './types/enhanced-report';
import { enrichIssuesWithAI } from './ai-enrichment';

export async function buildEnhancedReport(
  basicReport: VettReport,
  codeFiles: Map<string, string>,
  startTime: number,
  aiEnabled: boolean = true,
  onProgress?: (phase: string, pct: number) => void
): Promise<EnhancedReport> {
  const duration = Date.now() - startTime;
  
  // Convert findings to raw issues
  const rawIssues = basicReport.findings.map((f, index) => ({
    id: f.id || `ISSUE-${String(index + 1).padStart(3, '0')}`,
    title: f.title,
    severity: f.severity,
    category: f.category,
    file: f.file || 'unknown',
    line: f.line || 0,
    evidence: f.evidence || f.description,
    mitigation: f.mitigation,
  }));
  
  // AI Enrichment (if enabled)
  let enrichedIssues: EnrichedIssue[];
  if (aiEnabled && rawIssues.length > 0) {
    try {
      onProgress?.('AI enrichment', 0);
      enrichedIssues = await enrichIssuesWithAI(rawIssues, codeFiles, onProgress);
    } catch (error) {
      console.warn('AI enrichment failed, using basic enrichment');
      enrichedIssues = rawIssues.map(issue => createBasicEnrichment(issue, codeFiles));
    }
  } else {
    enrichedIssues = rawIssues.map(issue => createBasicEnrichment(issue, codeFiles));
  }
  
  // Generate insights
  const insights = generateProjectInsights(enrichedIssues);
  
  // Build summary
  const summary = {
    score: basicReport.score,
    grade: basicReport.grade,
    verdict: determineVerdict(basicReport.score, enrichedIssues),
    fix_priority: determineFixPriority(enrichedIssues),
    severity_counts: {
      critical: enrichedIssues.filter(i => i.severity === 'critical').length,
      high: enrichedIssues.filter(i => i.severity === 'high').length,
      medium: enrichedIssues.filter(i => i.severity === 'medium').length,
      low: enrichedIssues.filter(i => i.severity === 'low').length,
      info: enrichedIssues.filter(i => i.severity === 'info').length,
    },
  };
  
  return {
    meta: {
      project: basicReport.metadata?.projectName || 'Unknown Project',
      scan_mode: 'deep',
      timestamp: Date.now(),
      duration_ms: duration,
      ai_enabled: aiEnabled,
      files_scanned: basicReport.metadata?.filesScanned || 0,
      lines_scanned: basicReport.metadata?.linesScanned || 0,
    },
    summary,
    insights,
    issues: enrichedIssues,
  };
}

/**
 * Generate project insights
 */
function generateProjectInsights(issues: EnrichedIssue[]): ProjectInsights {
  // Group by file/area
  const fileGroups = new Map<string, number>();
  issues.forEach(issue => {
    const area = extractArea(issue.file);
    fileGroups.set(area, (fileGroups.get(area) || 0) + 1);
  });
  
  // Top risk areas
  const sortedAreas = Array.from(fileGroups.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  const totalIssues = issues.length;
  const top_risk_areas = sortedAreas.map(([area, count]) => ({
    area,
    percentage: Math.round((count / totalIssues) * 100),
    issue_count: count,
  }));
  
  // Most common issue
  const issueCounts = new Map<string, number>();
  issues.forEach(issue => {
    const baseTitle = issue.title.split('-')[0].trim();
    issueCounts.set(baseTitle, (issueCounts.get(baseTitle) || 0) + 1);
  });
  
  const mostCommon = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  const most_common_issue = mostCommon ? mostCommon[0] : 'No patterns detected';
  
  // Risk clusters (files with multiple issues)
  const risk_clusters = Array.from(fileGroups.entries())
    .filter(([_, count]) => count >= 3)
    .map(([area]) => area)
    .slice(0, 5);
  
  // Vulnerability categories
  const vulnerability_categories: Record<string, number> = {};
  issues.forEach(issue => {
    vulnerability_categories[issue.category] = 
      (vulnerability_categories[issue.category] || 0) + 1;
  });
  
  return {
    top_risk_areas,
    most_common_issue,
    risk_clusters,
    vulnerability_categories,
  };
}

/**
 * Extract area from file path
 */
function extractArea(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  
  // Look for key directories
  if (parts.includes('api')) return 'API Layer';
  if (parts.includes('auth')) return 'Auth System';
  if (parts.includes('database') || parts.includes('db')) return 'Database Layer';
  if (parts.includes('components')) return 'UI Components';
  if (parts.includes('utils') || parts.includes('helpers')) return 'Utilities';
  if (parts.includes('services')) return 'Services';
  if (parts.includes('models')) return 'Data Models';
  
  // Use first directory as area
  return parts.length > 1 ? parts[0] : 'Core';
}

/**
 * Determine overall verdict
 */
function determineVerdict(score: number, issues: EnrichedIssue[]): string {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  
  if (critical > 0) return 'CRITICAL RISK';
  if (high > 5) return 'HIGH RISK';
  if (score >= 80) return 'LOW RISK';
  if (score >= 60) return 'MODERATE RISK';
  return 'HIGH RISK';
}

/**
 * Determine fix priority
 */
function determineFixPriority(issues: EnrichedIssue[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  
  if (critical > 0) return 'CRITICAL';
  if (high > 3) return 'HIGH';
  if (high > 0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Create basic enrichment (fallback)
 */
function createBasicEnrichment(rawIssue: any, codeFiles: Map<string, string>): EnrichedIssue {
  return {
    id: rawIssue.id,
    title: rawIssue.title,
    severity: rawIssue.severity,
    category: rawIssue.category,
    file: rawIssue.file,
    line: rawIssue.line,
    
    description: rawIssue.evidence || `${rawIssue.title} detected in ${rawIssue.file}`,
    impact: determineBasicImpact(rawIssue.severity),
    root_cause: 'Detected by static analysis',
    
    fix: {
      summary: rawIssue.mitigation || 'Review and apply security best practices',
      before: '// Vulnerable code',
      after: '// Fixed code',
    },
    flow: [],
    code: {
      snippet: extractBasicSnippet(rawIssue.file, rawIssue.line, codeFiles),
      highlight_line: rawIssue.line,
      start_line: Math.max(1, rawIssue.line - 3),
      end_line: rawIssue.line + 3,
    },
    
    tags: [rawIssue.category],
    resolved: false,
    pinned: false,
  };
}

/**
 * Determine basic impact
 */
function determineBasicImpact(severity: string): string {
  const impacts: Record<string, string> = {
    critical: 'This vulnerability poses severe security risk and requires immediate attention.',
    high: 'This issue could be exploited to compromise system security.',
    medium: 'This vulnerability should be addressed to improve security posture.',
    low: 'This issue represents a minor security or quality concern.',
    info: 'Informational finding for awareness.',
  };
  
  return impacts[severity] || impacts.info;
}

/**
 * Extract basic code snippet
 */
function extractBasicSnippet(filePath: string, line: number, codeFiles: Map<string, string>): string {
  const content = codeFiles.get(filePath);
  if (!content) return '// Code not available';
  
  const lines = content.split('\n');
  const start = Math.max(0, line - 4);
  const end = Math.min(lines.length, line + 3);
  
  return lines.slice(start, end).join('\n');
}
