import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';
import { generateHTMLReport } from '../html-report-generator';
import type { VettReport } from '../types';

interface ResultsProps {
  report: VettReport;
  onBack: () => void;
  onExport: () => void;
}

export const Results: React.FC<ResultsProps> = ({ report, onBack, onExport }) => {
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

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            [~] SCAN RESULTS
          </Text>
        </Box>

        {/* Score */}
        <Box marginBottom={2}>
          <Text color="white">Score: </Text>
          <Text bold color={getScoreColor(report.score)}>
            {report.score}/100
          </Text>
          <Text color="gray"> ({report.grade})</Text>
        </Box>

        {/* Summary */}
        {report.summary && (
          <Box marginBottom={2}>
            <Text color="gray">{report.summary}</Text>
          </Box>
        )}

        {/* Findings by Severity */}
        <Box flexDirection="column" marginBottom={2}>
          <Box marginBottom={1}>
            <Text bold color="cyan">
              Findings by Severity:
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="red">  ● Critical: {findingsBySeverity.critical}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="red">  ● High: {findingsBySeverity.high}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="yellow">  ● Medium: {findingsBySeverity.medium}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="gray">  ● Low: {findingsBySeverity.low}</Text>
          </Box>
        </Box>

        {/* Critical Blockers */}
        {report.criticalBlockers && report.criticalBlockers.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Box marginBottom={1}>
              <Text bold color="red">
                [!] Critical Blockers:
              </Text>
            </Box>
            {report.criticalBlockers.slice(0, 3).map((blocker, index) => (
              <Box key={index} marginLeft={2}>
                <Text color="red">  • {blocker}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Strengths */}
        {report.strengths && report.strengths.length > 0 && (
          <Box flexDirection="column" marginBottom={2}>
            <Box marginBottom={1}>
              <Text bold color="green">
                [+] Strengths:
              </Text>
            </Box>
            {report.strengths.slice(0, 3).map((strength, index) => (
              <Box key={index} marginLeft={2}>
                <Text color="green">  • {strength}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Actions */}
        <Box marginTop={2}>
          <Text color="gray">
            Press [D] for detailed HTML report • [E] to export JSON • [B] to go back • [Q] to exit
          </Text>
        </Box>

        {/* Status Message */}
        {message !== null && message.length > 0 && (
          <Box marginTop={1}>
            <Text color="cyan">{message}</Text>
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};
