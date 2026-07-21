/**
 * HTML Report Generator
 * Generates a beautiful, detailed HTML report with AI explanations
 */

import * as fs from 'fs';
import * as path from 'path';
import type { VettReport } from './types';
import { generateInteractiveHTMLReport } from './interactive-report-generator';
import type { EnhancedReport } from './types/enhanced-report';

export interface DetailedReportOptions {
  outputDir?: string;
  openInBrowser?: boolean;
  includeAIExplanations?: boolean;
  enhancedReport?: EnhancedReport;
}

export function generateHTMLReport(
  report: VettReport,
  options: DetailedReportOptions = {}
): string {
  const {
    outputDir = process.cwd(),
    openInBrowser = true,
    enhancedReport,
  } = options;

  // Create reports directory
  const reportsDir = path.join(outputDir, '.vettcode-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `vettcode-report-${timestamp}.html`;
  const filepath = path.join(reportsDir, filename);

  // Generate HTML content - use interactive if enhanced report available
  let html: string;
  if (enhancedReport) {
    html = generateInteractiveHTMLReport(enhancedReport, filepath);
  } else {
    html = generateHTMLContent(report);
    fs.writeFileSync(filepath, html, 'utf-8');
  }

  // Open in browser if requested
  if (openInBrowser) {
    openInDefaultBrowser(filepath);
  }

  return filepath;
}

function generateHTMLContent(report: VettReport): string {
  const scoreColor = getScoreColor(report.score);
  const severityCounts = getSeverityCounts(report);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VettCode Report - ${report.metadata?.projectName || 'Scan Results'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }

    .logo {
      width: 50px;
      height: 50px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }

    .score-section {
      padding: 40px;
      text-align: center;
      background: #f8f9fa;
      border-bottom: 3px solid #e9ecef;
    }

    .score-circle {
      width: 200px;
      height: 200px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: ${scoreColor};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      position: relative;
    }

    .score-circle::before {
      content: '';
      position: absolute;
      inset: 10px;
      border-radius: 50%;
      background: white;
    }

    .score-value {
      font-size: 4em;
      font-weight: bold;
      color: ${scoreColor};
      position: relative;
      z-index: 1;
    }

    .grade {
      font-size: 2em;
      font-weight: bold;
      color: #666;
      margin-top: 10px;
    }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 1.8em;
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e9ecef;
    }

    .verdict {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .severity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .severity-card {
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .severity-card.critical { background: #fee; border: 2px solid #dc3545; }
    .severity-card.high { background: #fff4f4; border: 2px solid #ff6b6b; }
    .severity-card.medium { background: #fff9e6; border: 2px solid #ffc107; }
    .severity-card.low { background: #f0f0f0; border: 2px solid #6c757d; }

    .severity-count {
      font-size: 3em;
      font-weight: bold;
      margin: 10px 0;
    }

    .severity-card.critical .severity-count { color: #dc3545; }
    .severity-card.high .severity-count { color: #ff6b6b; }
    .severity-card.medium .severity-count { color: #ffc107; }
    .severity-card.low .severity-count { color: #6c757d; }

    .findings-list {
      margin-top: 20px;
    }

    .finding {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .finding:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .finding-header {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 15px;
    }

    .severity-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 0.85em;
      text-transform: uppercase;
    }

    .severity-badge.critical { background: #dc3545; color: white; }
    .severity-badge.high { background: #ff6b6b; color: white; }
    .severity-badge.medium { background: #ffc107; color: #333; }
    .severity-badge.low { background: #6c757d; color: white; }

    .finding-title {
      flex: 1;
      font-size: 1.3em;
      font-weight: 600;
      color: #333;
    }

    .finding-location {
      color: #666;
      font-family: 'Courier New', monospace;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .finding-description {
      color: #666;
      margin-bottom: 15px;
      line-height: 1.6;
    }

    .finding-evidence {
      background: #282c34;
      color: #abb2bf;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      overflow-x: auto;
      margin: 15px 0;
    }

    .finding-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }

    .action-box {
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .action-box.mitigation { background: #e8f4f8; border-color: #17a2b8; }
    .action-box.prevention { background: #f0f9ff; border-color: #0d6efd; }

    .action-title {
      font-weight: bold;
      margin-bottom: 8px;
      color: #333;
    }

    .strengths-list, .blockers-list {
      list-style: none;
    }

    .strengths-list li, .blockers-list li {
      padding: 12px;
      background: #f8f9fa;
      margin-bottom: 10px;
      border-radius: 8px;
      border-left: 4px solid #28a745;
    }

    .blockers-list li {
      background: #fee;
      border-left-color: #dc3545;
    }

    .metadata {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .meta-item {
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .meta-label {
      font-size: 0.85em;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-value {
      font-size: 1.3em;
      font-weight: bold;
      color: #333;
      margin-top: 5px;
    }

    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      border-top: 1px solid #e9ecef;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .finding:hover {
        transform: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>
        <div class="logo">[V]</div>
        VettCode Security Report
      </h1>
      <p>${report.metadata?.projectName || 'Code Security Analysis'}</p>
      <p style="font-size: 0.9em; opacity: 0.8;">Generated on ${new Date(report.metadata?.scannedAt || Date.now()).toLocaleString()}</p>
    </div>

    <!-- Score Section -->
    <div class="score-section">
      <div class="score-circle">
        <div class="score-value">${report.score}</div>
      </div>
      <div class="grade">Grade: ${report.grade}</div>
      <p style="margin-top: 15px; color: #666;">${report.summary}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Executive Verdict -->
      <div class="section">
        <h2 class="section-title">Executive Verdict</h2>
        <div class="verdict">
          <p>${report.executiveVerdict}</p>
        </div>
      </div>

      <!-- Severity Overview -->
      <div class="section">
        <h2 class="section-title">Findings Overview</h2>
        <div class="severity-grid">
          <div class="severity-card critical">
            <div class="severity-label">Critical</div>
            <div class="severity-count">${severityCounts.critical}</div>
          </div>
          <div class="severity-card high">
            <div class="severity-label">High</div>
            <div class="severity-count">${severityCounts.high}</div>
          </div>
          <div class="severity-card medium">
            <div class="severity-label">Medium</div>
            <div class="severity-count">${severityCounts.medium}</div>
          </div>
          <div class="severity-card low">
            <div class="severity-label">Low</div>
            <div class="severity-count">${severityCounts.low}</div>
          </div>
        </div>
      </div>

      ${report.criticalBlockers && report.criticalBlockers.length > 0 ? `
      <!-- Critical Blockers -->
      <div class="section">
        <h2 class="section-title">⚠️ Critical Blockers</h2>
        <ul class="blockers-list">
          ${report.criticalBlockers.map(blocker => `<li>${blocker}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${report.strengths && report.strengths.length > 0 ? `
      <!-- Strengths -->
      <div class="section">
        <h2 class="section-title">✓ Strengths</h2>
        <ul class="strengths-list">
          ${report.strengths.map(strength => `<li>${strength}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Detailed Findings -->
      <div class="section">
        <h2 class="section-title">Detailed Findings (${report.findings.length})</h2>
        <div class="findings-list">
          ${report.findings.map(finding => `
            <div class="finding">
              <div class="finding-header">
                <span class="severity-badge ${finding.severity}">${finding.severity}</span>
                <div class="finding-title">${finding.title}</div>
              </div>
              ${finding.file ? `<div class="finding-location">${finding.file}:${finding.line || 0}</div>` : ''}
              <div class="finding-description">${finding.description}</div>
              ${finding.evidence ? `
                <div class="finding-evidence"><code>${escapeHtml(finding.evidence)}</code></div>
              ` : ''}
              <div class="finding-actions">
                <div class="action-box mitigation">
                  <div class="action-title">🔧 Mitigation</div>
                  <div>${finding.mitigation}</div>
                </div>
                <div class="action-box prevention">
                  <div class="action-title">🛡️ Prevention</div>
                  <div>${finding.prevention}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Metadata -->
      <div class="section">
        <h2 class="section-title">Scan Metadata</h2>
        <div class="metadata">
          <div class="meta-item">
            <div class="meta-label">Files Scanned</div>
            <div class="meta-value">${report.metadata?.filesScanned || 0}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Lines Analyzed</div>
            <div class="meta-value">${report.metadata?.linesScanned?.toLocaleString() || 0}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Report Confidence</div>
            <div class="meta-value">${report.metadata?.reportConfidence || 0}%</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Scan Mode</div>
            <div class="meta-value">${report.metadata?.aiFindings ? 'AI-Enhanced' : 'Static Analysis'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>VettCode CLI</strong> - Enterprise-Grade Code Security Scanner</p>
      <p style="margin-top: 10px;">Powered by AD-Technologies and AI Enterprises</p>
      <p style="margin-top: 5px; font-size: 0.9em;">Special thanks to Masereka Adorable and Hacker X</p>
    </div>
  </div>
</body>
</html>`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#28a745';
  if (score >= 60) return '#ffc107';
  return '#dc3545';
}

function getSeverityCounts(report: VettReport) {
  return {
    critical: report.findings.filter(f => f.severity === 'critical').length,
    high: report.findings.filter(f => f.severity === 'high').length,
    medium: report.findings.filter(f => f.severity === 'medium').length,
    low: report.findings.filter(f => f.severity === 'low').length,
  };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function openInDefaultBrowser(filepath: string) {
  const { exec } = require('child_process');
  
  // Convert to absolute path and URL format
  const absolutePath = path.resolve(filepath);
  
  const command = process.platform === 'win32' 
    ? `start "" "${absolutePath}"`
    : process.platform === 'darwin'
    ? `open "${absolutePath}"`
    : `xdg-open "${absolutePath}"`;
  
  exec(command, (error: any) => {
    if (error) {
      console.error(`Failed to open browser: ${error.message}`);
    }
  });
}
