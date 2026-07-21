/**
 * Interactive HTML Report Generator
 * Generates production-grade interactive debugging environment
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EnhancedReport } from './types/enhanced-report';

export function generateInteractiveHTMLReport(
  enhancedReport: EnhancedReport,
  outputPath: string
): string {
  const html = buildInteractiveHTML(enhancedReport);
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

function buildInteractiveHTML(report: EnhancedReport): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VettCode Report - ${report.meta.project}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    
    .app-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      color: white;
      position: relative;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge-critical { background: #ff4d4f; color: white; }
    .badge-high { background: #ff7a45; color: white; }
    .badge-medium { background: #ffa940; color: white; }
    .badge-low { background: #52c41a; color: white; }
    .badge-info { background: #1890ff; color: white; }
    
    .issue-card {
      background: white;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .issue-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .issue-card.expanded {
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }
    
    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .code-block .line {
      display: block;
    }
    
    .code-block .highlight {
      background: rgba(255, 77, 79, 0.2);
      border-left: 3px solid #ff4d4f;
      padding-left: 8px;
      margin-left: -8px;
    }
    
    .sidebar {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 180px;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
    }
    
    .filter-btn {
      width: 100%;
      text-align: left;
      padding: 12px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .filter-btn:hover {
      background: #f5f5f5;
    }
    
    .filter-btn.active {
      background: #1890ff;
      color: white;
    }
    
    .search-box {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s;
    }
    
    .search-box:focus {
      outline: none;
      border-color: #1890ff;
      box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
    }
    
    .tab-btn {
      padding: 12px 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid transparent;
      transition: all 0.3s;
    }
    
    .tab-btn.active {
      color: #1890ff;
      border-bottom-color: #1890ff;
    }
    
    .insights-panel {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .risk-bar {
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .risk-bar-fill {
      height: 100%;
      background: white;
      transition: width 0.3s ease;
    }
    
    .tag {
      display: inline-block;
      padding: 4px 8px;
      background: #f0f0f0;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    
    .flow-step {
      padding: 8px 12px;
      background: #e6f7ff;
      border-left: 3px solid #1890ff;
      border-radius: 4px;
      margin-bottom: 8px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animated {
      animation: slideDown 0.3s ease;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script>
    // Inject report data
    window.__VETTCODE_REPORT__ = ${JSON.stringify(report, null, 2)};
  </script>
  
  <script>
    const { useState, useEffect, useMemo } = React;
    const { createRoot } = ReactDOM;
    
    // Main App Component
    function App() {
      const report = window.__VETTCODE_REPORT__;
      const [activeTab, setActiveTab] = useState('issues');
      const [searchQuery, setSearchQuery] = useState('');
      const [severityFilter, setSeverityFilter] = useState('all');
      const [expandedIssues, setExpandedIssues] = useState(new Set());
      const [resolvedIssues, setResolvedIssues] = useState(() => {
        const saved = localStorage.getItem('vettcode_resolved');
        return saved ? new Set(JSON.parse(saved)) : new Set();
      });
      
      // Filter issues
      const filteredIssues = useMemo(() => {
        let filtered = report.issues;
        
        // Severity filter
        if (severityFilter !== 'all') {
          filtered = filtered.filter(i => i.severity === severityFilter);
        }
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(i =>
            i.title.toLowerCase().includes(query) ||
            i.file.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query)
          );
        }
        
        // Hide resolved if in fix mode
        if (activeTab === 'fix') {
          filtered = filtered.filter(i => !resolvedIssues.has(i.id));
        }
        
        return filtered;
      }, [report.issues, severityFilter, searchQuery, activeTab, resolvedIssues]);
      
      // Toggle issue expansion
      const toggleIssue = (id) => {
        const newExpanded = new Set(expandedIssues);
        if (newExpanded.has(id)) {
          newExpanded.delete(id);
        } else {
          newExpanded.add(id);
        }
        setExpandedIssues(newExpanded);
      };
      
      // Toggle resolved
      const toggleResolved = (id) => {
        const newResolved = new Set(resolvedIssues);
        if (newResolved.has(id)) {
          newResolved.delete(id);
        } else {
          newResolved.add(id);
        }
        setResolvedIssues(newResolved);
        localStorage.setItem('vettcode_resolved', JSON.stringify([...newResolved]));
      };
      
      return React.createElement('div', { className: 'app-container' },
        // Sticky Header
        React.createElement(StickyHeader, { report }),
        
        // Tabs
        React.createElement('div', { style: { background: 'white', borderRadius: '12px', marginBottom: '20px', padding: '8px' } },
          React.createElement('button', {
            className: \`tab-btn \${activeTab === 'issues' ? 'active' : ''}\`,
            onClick: () => setActiveTab('issues')
          }, 'View Mode'),
          React.createElement('button', {
            className: \`tab-btn \${activeTab === 'fix' ? 'active' : ''}\`,
            onClick: () => setActiveTab('fix')
          }, 'Fix Mode'),
          React.createElement('button', {
            className: \`tab-btn \${activeTab === 'insights' ? 'active' : ''}\`,
            onClick: () => setActiveTab('insights')
          }, 'Insights')
        ),
        
        // Insights Tab
        activeTab === 'insights' && React.createElement(InsightsPanel, { report }),
        
        // Main Content
        (activeTab === 'issues' || activeTab === 'fix') && React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' } },
          // Sidebar
          React.createElement(Sidebar, {
            severityFilter,
            setSeverityFilter,
            searchQuery,
            setSearchQuery,
            report
          }),
          
          // Issue List
          React.createElement('div', null,
            filteredIssues.length === 0 && React.createElement('div', {
              style: { background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center' }
            },
              React.createElement('p', { style: { fontSize: '18px', color: '#999' } },
                searchQuery ? 'No issues found matching your search' : 'No issues to display'
              )
            ),
            
            filteredIssues.map(issue =>
              React.createElement(IssueCard, {
                key: issue.id,
                issue,
                expanded: expandedIssues.has(issue.id),
                resolved: resolvedIssues.has(issue.id),
                onToggle: () => toggleIssue(issue.id),
                onToggleResolved: () => toggleResolved(issue.id),
                fixMode: activeTab === 'fix'
              })
            )
          )
        )
      );
    }
    
    // Component implementations will follow...
    ${generateComponentsCode()}
    
    // Render
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;
}

function generateComponentsCode(): string {
  return `
    // Sticky Header Component
    function StickyHeader({ report }) {
      const getScoreColor = (score) => {
        if (score >= 80) return '#52c41a';
        if (score >= 60) return '#ffa940';
        return '#ff4d4f';
      };
      
      return React.createElement('div', { className: 'sticky-header', style: { padding: '24px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' } },
          // Score Circle
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '20px' } },
            React.createElement('div', {
              className: 'score-circle',
              style: { background: \`conic-gradient(\${getScoreColor(report.summary.score)} \${report.summary.score * 3.6}deg, #333 0deg)\` }
            },
              React.createElement('div', { style: { background: '#000', borderRadius: '50%', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' } },
                React.createElement('div', { style: { fontSize: '32px', color: 'white' } }, report.summary.score),
                React.createElement('div', { style: { fontSize: '14px', color: '#999' } }, report.summary.grade)
              )
            ),
            React.createElement('div', null,
              React.createElement('h1', { style: { color: 'white', fontSize: '24px', marginBottom: '8px' } }, report.meta.project),
              React.createElement('div', { style: { color: '#999', fontSize: '14px' } },
                \`Scanned \${report.meta.files_scanned} files · \${report.meta.lines_scanned} lines\`
              )
            )
          ),
          
          // Severity Counts
          React.createElement('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
            React.createElement('div', { className: 'severity-badge badge-critical' },
              \`Critical: \${report.summary.severity_counts.critical}\`
            ),
            React.createElement('div', { className: 'severity-badge badge-high' },
              \`High: \${report.summary.severity_counts.high}\`
            ),
            React.createElement('div', { className: 'severity-badge badge-medium' },
              \`Medium: \${report.summary.severity_counts.medium}\`
            ),
            React.createElement('div', { className: 'severity-badge badge-low' },
              \`Low: \${report.summary.severity_counts.low}\`
            )
          ),
          
          // Verdict
          React.createElement('div', { style: { textAlign: 'right' } },
            React.createElement('div', { style: { color: '#999', fontSize: '12px', marginBottom: '4px' } }, 'VERDICT'),
            React.createElement('div', { style: { color: 'white', fontSize: '18px', fontWeight: '600' } }, report.summary.verdict),
            React.createElement('div', { style: { color: getScoreColor(report.summary.score), fontSize: '14px', marginTop: '4px' } },
              \`Fix Priority: \${report.summary.fix_priority}\`
            )
          )
        )
      );
    }
    
    // Sidebar Component
    function Sidebar({ severityFilter, setSeverityFilter, searchQuery, setSearchQuery, report }) {
      return React.createElement('div', { className: 'sidebar' },
        // Search
        React.createElement('input', {
          type: 'text',
          className: 'search-box',
          placeholder: 'Search issues...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value)
        }),
        
        React.createElement('div', { style: { marginTop: '24px' } },
          React.createElement('h3', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#666' } }, 'FILTER BY SEVERITY'),
          
          React.createElement('button', {
            className: \`filter-btn \${severityFilter === 'all' ? 'active' : ''}\`,
            onClick: () => setSeverityFilter('all')
          },
            React.createElement('span', null, 'All Issues'),
            React.createElement('span', null, report.issues.length)
          ),
          
          React.createElement('button', {
            className: \`filter-btn \${severityFilter === 'critical' ? 'active' : ''}\`,
            onClick: () => setSeverityFilter('critical')
          },
            React.createElement('span', null, '🔴 Critical'),
            React.createElement('span', null, report.summary.severity_counts.critical)
          ),
          
          React.createElement('button', {
            className: \`filter-btn \${severityFilter === 'high' ? 'active' : ''}\`,
            onClick: () => setSeverityFilter('high')
          },
            React.createElement('span', null, '🟠 High'),
            React.createElement('span', null, report.summary.severity_counts.high)
          ),
          
          React.createElement('button', {
            className: \`filter-btn \${severityFilter === 'medium' ? 'active' : ''}\`,
            onClick: () => setSeverityFilter('medium')
          },
            React.createElement('span', null, '🟡 Medium'),
            React.createElement('span', null, report.summary.severity_counts.medium)
          ),
          
          React.createElement('button', {
            className: \`filter-btn \${severityFilter === 'low' ? 'active' : ''}\`,
            onClick: () => setSeverityFilter('low')
          },
            React.createElement('span', null, '🔵 Low'),
            React.createElement('span', null, report.summary.severity_counts.low)
          )
        )
      );
    }
    
    // Issue Card Component
    function IssueCard({ issue, expanded, resolved, onToggle, onToggleResolved, fixMode }) {
      const getSeverityColor = (severity) => {
        const colors = {
          critical: '#ff4d4f',
          high: '#ff7a45',
          medium: '#ffa940',
          low: '#52c41a',
          info: '#1890ff'
        };
        return colors[severity] || colors.info;
      };
      
      return React.createElement('div', {
        className: \`issue-card \${expanded ? 'expanded' : ''} \${resolved ? 'opacity-50' : ''}\`,
        style: { opacity: resolved ? 0.6 : 1 }
      },
        // Header
        React.createElement('div', {
          style: { padding: '20px', cursor: 'pointer' },
          onClick: onToggle
        },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' } },
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { marginBottom: '8px' } },
                React.createElement('span', {
                  className: \`severity-badge badge-\${issue.severity}\`,
                  style: { marginRight: '8px' }
                }, issue.severity.toUpperCase()),
                issue.tags.map(tag =>
                  React.createElement('span', { key: tag, className: 'tag' }, tag)
                )
              ),
              React.createElement('h3', { style: { fontSize: '18px', fontWeight: '600', marginBottom: '8px' } }, issue.title),
              React.createElement('div', { style: { color: '#666', fontSize: '14px' } },
                \`\${issue.file}:\${issue.line}\`
              )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('button', {
                onClick: (e) => { e.stopPropagation(); onToggleResolved(); },
                style: {
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: resolved ? '#52c41a' : '#f0f0f0',
                  color: resolved ? 'white' : '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }
              }, resolved ? '✓ Resolved' : 'Mark Resolved'),
              React.createElement('div', { style: { fontSize: '20px', color: '#999' } },
                expanded ? '▲' : '▼'
              )
            )
          )
        ),
        
        // Expanded Content
        expanded && React.createElement('div', { className: 'animated', style: { padding: '0 20px 20px', borderTop: '1px solid #f0f0f0' } },
          // Description
          React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '🔍 DESCRIPTION'),
            React.createElement('p', { style: { lineHeight: 1.6, color: '#333' } }, issue.description)
          ),
          
          // Impact
          React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '💥 IMPACT'),
            React.createElement('p', { style: { lineHeight: 1.6, color: '#333' } }, issue.impact)
          ),
          
          // Root Cause
          React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '🧠 ROOT CAUSE'),
            React.createElement('p', { style: { lineHeight: 1.6, color: '#333' } }, issue.root_cause)
          ),
          
          // Code Snippet
          React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '📍 CODE'),
            React.createElement('div', { className: 'code-block' },
              React.createElement('pre', null, issue.code.snippet)
            )
          ),
          
          // Fix
          fixMode && React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '🛠 FIX'),
            React.createElement('p', { style: { marginBottom: '12px', color: '#333' } }, issue.fix.summary),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '12px', color: '#999', marginBottom: '4px' } }, '❌ Before'),
                React.createElement('div', { className: 'code-block' },
                  React.createElement('pre', null, issue.fix.before)
                )
              ),
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '12px', color: '#999', marginBottom: '4px' } }, '✅ After'),
                React.createElement('div', { className: 'code-block' },
                  React.createElement('pre', null, issue.fix.after)
                )
              )
            )
          ),
          
          // Data Flow
          issue.flow && issue.flow.length > 0 && React.createElement('div', { style: { marginTop: '20px' } },
            React.createElement('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' } }, '🧭 DATA FLOW'),
            issue.flow.map((step, i) =>
              React.createElement('div', { key: i, className: 'flow-step' },
                \`\${i + 1}. \${step}\`
              )
            )
          )
        )
      );
    }
    
    // Insights Panel Component
    function InsightsPanel({ report }) {
      return React.createElement('div', null,
        React.createElement('div', { className: 'insights-panel' },
          React.createElement('h2', { style: { fontSize: '24px', fontWeight: '600', marginBottom: '20px' } }, 'Project Insights'),
          
          // Top Risk Areas
          React.createElement('div', { style: { marginBottom: '24px' } },
            React.createElement('h3', { style: { fontSize: '16px', marginBottom: '12px' } }, 'Top Risk Areas'),
            report.insights.top_risk_areas.map(area =>
              React.createElement('div', { key: area.area, style: { marginBottom: '12px' } },
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' } },
                  React.createElement('span', null, area.area),
                  React.createElement('span', null, \`\${area.percentage}% (\${area.issue_count} issues)\`)
                ),
                React.createElement('div', { className: 'risk-bar' },
                  React.createElement('div', { className: 'risk-bar-fill', style: { width: \`\${area.percentage}%\` } })
                )
              )
            )
          ),
          
          // Most Common Issue
          React.createElement('div', { style: { marginBottom: '24px' } },
            React.createElement('h3', { style: { fontSize: '16px', marginBottom: '8px' } }, 'Most Common Issue'),
            React.createElement('p', { style: { fontSize: '18px', fontWeight: '600' } }, report.insights.most_common_issue)
          ),
          
          // Risk Clusters
          report.insights.risk_clusters.length > 0 && React.createElement('div', null,
            React.createElement('h3', { style: { fontSize: '16px', marginBottom: '8px' } }, 'Risk Clusters'),
            React.createElement('ul', { style: { listStyle: 'none' } },
              report.insights.risk_clusters.map(cluster =>
                React.createElement('li', { key: cluster, style: { padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' } }, cluster)
              )
            )
          )
        ),
        
        // Vulnerability Categories
        React.createElement('div', { style: { background: 'white', borderRadius: '12px', padding: '24px', marginTop: '20px' } },
          React.createElement('h3', { style: { fontSize: '18px', fontWeight: '600', marginBottom: '16px' } }, 'Vulnerability Categories'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' } },
            Object.entries(report.insights.vulnerability_categories).map(([category, count]) =>
              React.createElement('div', {
                key: category,
                style: {
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }
              },
                React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', color: '#1890ff' } }, count),
                React.createElement('div', { style: { fontSize: '14px', color: '#666', marginTop: '4px' } }, category)
              )
            )
          )
        )
      );
    }
  `;
}
