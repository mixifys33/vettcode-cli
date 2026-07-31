import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';
import { generateHTMLReport } from '../html-report-generator';
import type { VettReport } from '../types';

interface ResultsProps {
  report: VettReport;
  uploadResult?: any;
  onBack: () => void;
  onExport: () => void;
}

export const Results: React.FC<ResultsProps> = ({ report, uploadResult, onBack, onExport }) => {
  const [message, setMessage] = useState<string | null>(null);

  useInput((input, key) => {
    if (input === 'b' || input === 'B' || key.escape) {
      onBack();
    } else if (input === 'e' || input === 'E') {
      onExport();
    } else if (input === 'd' || input === 'D') {
      // Generate detailed HTML report
      try {
        const reportPath = generateHTMLReport(report, {
          outputDir: process.cwd(),
          openInBrowser: true,
        });
        setMessage(`Report saved to: ${reportPath}`);
        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to generate report'}`);
        setTimeout(() => setMessage(null), 5000);
      }
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const findingsBySeverity = {
    critical: report.findings.filter((f) => f.severity === 'critical').length,
    high: report.findings.filter((f) => f.severity === 'high').length,
    medium: report.findings.filter((f) => f.severity === 'medium').length,
    low: report.findings.filter((f) => f.severity === 'low').length,
  };

  const topIssues = report.findings
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 3);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            ──────────────────────────────────────────────────
          </Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {'  '}SCAN RESULTS
          </Text>
        </Box>
        
        <Box marginBottom={2}>
          <Text bold color="cyan">
            ──────────────────────────────────────────────────
          </Text>
        </Box>

        {/* Score */}
        <Box marginBottom={1}>
          <Text color="white">  Score: </Text>
          <Text bold color={getScoreColor(report.score)}>
            {report.score}/100
          </Text>
          <Text color="white"> ({report.grade})</Text>
        </Box>

        {/* Findings by Severity */}
        <Box marginBottom={2}>
          <Box>
            <Text bold color="white">{'  '}Findings by Severity:</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="red">    {findingsBySeverity.critical} Critical  |  </Text>
            <Text color="red">{findingsBySeverity.high} High  |  </Text>
            <Text color="yellow">{findingsBySeverity.medium} Medium  |  </Text>
            <Text color="gray">{findingsBySeverity.low} Low</Text>
          </Box>
        </Box>

        {/* Top Priority Issues */}
        {topIssues.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Box marginBottom={1}>
              <Text bold color="red">
                {'  '}Top Priority Issues:
              </Text>
            </Box>
            {topIssues.map((issue, index) => {
              const shortFile = issue.file && issue.file.length > 50 ? '...' + issue.file.slice(-47) : (issue.file || 'unknown');
              return (
                <Box key={index} flexDirection="column" marginLeft={2}>
                  <Text color="red">    {index + 1}. {issue.title || 'Untitled issue'}</Text>
                  <Text color="gray">       {shortFile}:{issue.line || '0'}</Text>
                </Box>
              );
            })}
          </Box>
        )}

        <Box marginBottom={1}>
          <Text color="cyan">
            ──────────────────────────────────────────────────
          </Text>
        </Box>

        {/* Report Upload Information */}
        {uploadResult && uploadResult.webUrl && (
          <Box flexDirection="column" marginTop={1} marginBottom={2}>
            <Box marginBottom={1}>
              <Text color="green">✔ Report available online</Text>
            </Box>

            <Box marginBottom={1}>
              <Text color="cyan">╔════════════════════════════════════════════════╗</Text>
            </Box>
            <Box marginBottom={1}>
              <Text color="cyan">║</Text>
              <Text bold color="white">     📊 ANALYSIS REPORT READY     </Text>
              <Text color="cyan">║</Text>
            </Box>
            <Box marginBottom={1}>
              <Text color="cyan">╚════════════════════════════════════════════════╝</Text>
            </Box>

            <Box marginBottom={1} marginTop={1}>
              <Text bold color="cyan">🌐 View interactive report:</Text>
            </Box>
            <Box marginBottom={1} marginLeft={1}>
              <Text color="white">{uploadResult.webUrl}</Text>
            </Box>

            <Box marginBottom={1} marginTop={1}>
              <Text bold color="cyan">📌 What you can do:</Text>
            </Box>
            <Box marginLeft={1}>
              <Text color="gray">   • Explore vulnerabilities interactively</Text>
            </Box>
            <Box marginLeft={1}>
              <Text color="gray">   • Get AI-guided remediation suggestions</Text>
            </Box>
            <Box marginLeft={1}>
              <Text color="gray">   • Filter and prioritize issues</Text>
            </Box>
            <Box marginLeft={1} marginBottom={1}>
              <Text color="gray">   • Share results with your team</Text>
            </Box>

            {uploadResult.expiresAt && (
              <Box marginTop={1}>
                <Text color="yellow">⏱️  Link expires: </Text>
                <Text color="white">{new Date(uploadResult.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                <Text color="yellow"> (4 days)</Text>
              </Box>
            )}
          </Box>
        )}

        {/* Local report info */}
        {report.metadata && report.metadata.projectName && (
          <Box marginTop={1}>
            <Text color="gray">📁 Local backup: {process.cwd()}/.vettcode-reports/</Text>
          </Box>
        )}

        {/* Actions */}
        <Box marginTop={2}>
          <Text color="gray">
            Press [D] for detailed HTML report • [E] to export JSON • [B] to go back • [Q] to exit
          </Text>
        </Box>

        {/* Status Message */}
        {message && message.length > 0 && (
          <Box marginTop={1}>
            <Text color="cyan">{message}</Text>
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};
