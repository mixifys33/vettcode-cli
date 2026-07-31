import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';
import { collectFiles } from '../file-collector';
import { runSmartScan } from '../cli-scan-orchestrator';
import { generateHTMLReport } from '../html-report-generator';
import { uploadReport } from '../api-client';
import type { ScanMode } from '../cli-scan-orchestrator';

interface ScanProps {
  directory: string;
  mode: ScanMode;
  aiEnabled?: boolean;
  onComplete: (report: any, uploadResult?: any) => void;
  onCancel: () => void;
}

type ScanStage = 
  | 'collecting'
  | 'static_analysis'
  | 'deep_analysis'
  | 'validation'
  | 'reporting'
  | 'uploading'
  | 'complete';

const STAGE_TITLES: Record<ScanStage, string> = {
  collecting: 'Collecting project files',
  static_analysis: 'Static analysis',
  deep_analysis: 'Deep analysis',
  validation: 'Validating findings',
  reporting: 'Generating report',
  uploading: 'Uploading report',
  complete: 'Complete',
};

const STAGE_MESSAGES: Record<ScanStage, string[]> = {
  collecting: ['Scanning directories...', 'Filtering code files...'],
  static_analysis: [
    'Detecting known vulnerability patterns...',
    'Analyzing code structure...',
    'Checking security configurations...',
  ],
  deep_analysis: [
    'Inspecting code behavior...',
    'Evaluating input handling...',
    'Tracing execution paths...',
    'Analyzing data flow...',
  ],
  validation: [
    'Eliminating false positives...',
    'Cross-referencing results...',
    'Calculating confidence scores...',
  ],
  reporting: [
    'Structuring analysis results...',
    'Preparing security summary...',
  ],
  uploading: [
    'Uploading to secure storage...',
    'Generating shareable link...',
  ],
  complete: ['Scan complete'],
};

export const Scan: React.FC<ScanProps> = ({
  directory,
  mode,
  aiEnabled = true,
  onComplete,
  onCancel,
}) => {
  const [stage, setStage] = useState<ScanStage>('collecting');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('Preparing scan...');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filesCount, setFilesCount] = useState(0);
  const [completedStages, setCompletedStages] = useState<ScanStage[]>([]);

  // Rotate messages within current stage
  useEffect(() => {
    const messages = STAGE_MESSAGES[stage];
    if (messages.length > 1 && stage !== 'complete') {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  useEffect(() => {
    let cancelled = false;

    const runActualScan = async () => {
      try {
        // Stage 1: Collect files
        setStage('collecting');
        setProgress(5);
        setDetail(`Scanning directory: ${directory}`);
        
        const files = collectFiles(directory, undefined);
        
        if (cancelled) return;
        
        setFilesCount(files.length);
        setDetail(`Found ${files.length} files to analyze`);
        setProgress(10);
        
        // Mark collecting as complete
        setCompletedStages(['collecting']);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (files.length === 0) {
          setError('No code files found in the directory');
          return;
        }

        // Run smart scan with stage tracking
        const { report, stats } = await runSmartScan(
          directory,
          files,
          0,
          (phaseMsg: string, pct: number, detailMsg?: string) => {
            if (!cancelled && !isPaused) {
              // Map phase messages to stages
              if (phaseMsg.includes('Static analysis')) {
                setStage('static_analysis');
                if (!completedStages.includes('static_analysis')) {
                  setCompletedStages(prev => [...prev, 'static_analysis']);
                }
              } else if (phaseMsg.includes('AI review') || phaseMsg.includes('Deep analysis') || phaseMsg.includes('Enhanced Analysis')) {
                setStage('deep_analysis');
              } else if (phaseMsg.includes('Verification')) {
                setStage('validation');
              } else if (phaseMsg.includes('Report')) {
                setStage('reporting');
              }
              
              setProgress(pct);
              if (detailMsg) {
                setDetail(detailMsg);
              }
            }
          },
          mode,
          !aiEnabled
        );

        if (cancelled) return;

        // Mark validation as complete
        setCompletedStages(prev => [...prev, 'validation']);

        // Stage: Generate report
        setStage('reporting');
        setProgress(90);
        setDetail('Structuring analysis results...');
        
        const projectName = directory.split(/[/\\]/).pop() || 'project';
        const reportPath = generateHTMLReport(report, {
          outputDir: directory,
          openInBrowser: false,
          forUpload: false,
          projectName: projectName,
        });
        
        setCompletedStages(prev => [...prev, 'reporting']);
        setDetail(`Report saved to ${reportPath}`);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Stage: Upload report
        setStage('uploading');
        setProgress(95);
        setDetail('Uploading to backend...');
        
        let uploadResult = null;
        try {
          const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 4);
          
          const reportData = {
            id: reportId,
            projectName,
            ...report,
            scanMode: mode,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
          };
          
          uploadResult = await uploadReport({
            reportData,
            reportId,
            projectName,
          });
          
          setDetail('Report uploaded successfully!');
          setCompletedStages(prev => [...prev, 'uploading']);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          setDetail('Upload failed - report saved locally');
        }

        // Complete
        setStage('complete');
        setProgress(100);
        setDetail('Scan complete');
        setCompletedStages(prev => [...prev, 'complete']);
        
        // Wait a moment before showing results
        setTimeout(() => {
          onComplete(report, uploadResult);
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Scan failed');
          setStage('complete');
          setProgress(0);
        }
      }
    };

    runActualScan();

    return () => {
      cancelled = true;
    };
  }, [directory, mode, aiEnabled, isPaused, onComplete]);

  const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));
  const currentMessage = STAGE_MESSAGES[stage][messageIndex] || STAGE_MESSAGES[stage][0];

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            VettCode CLI • Security Scanner
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="white">Directory: </Text>
          <Text color="green">{directory}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="white">Mode: </Text>
          <Text color="yellow">{mode === 'quick' ? 'Quick Scan' : 'Deep Scan'}</Text>
          <Text color="white"> | AI: </Text>
          <Text color={aiEnabled ? 'green' : 'red'}>{aiEnabled ? 'Enabled' : 'Disabled'}</Text>
        </Box>

        {filesCount > 0 && (
          <Box marginBottom={1}>
            <Text color="white">Files: </Text>
            <Text color="cyan">{filesCount}</Text>
          </Box>
        )}

        <Box marginTop={1} marginBottom={1}>
          <Text color="gray">──────────────────────────────────────────────────</Text>
        </Box>

        {/* Show completed stages with checkmarks */}
        {completedStages.includes('collecting') && stage !== 'collecting' && (
          <Box marginBottom={0}>
            <Text color="green">✔ </Text>
            <Text color="green">Collected {filesCount} files</Text>
          </Box>
        )}
        
        {completedStages.includes('static_analysis') && stage !== 'static_analysis' && (
          <Box marginBottom={0}>
            <Text color="green">✔ </Text>
            <Text color="blue">Static analysis complete</Text>
          </Box>
        )}

        {/* Current stage with spinner */}
        {!completedStages.includes(stage) && (
          <Box marginBottom={1}>
            <Text color="cyan">
              <Spinner type="dots" />
            </Text>
            <Text color="white"> {STAGE_TITLES[stage]}</Text>
          </Box>
        )}

        {/* Show rotating message for current stage */}
        {!completedStages.includes(stage) && currentMessage && currentMessage.length > 0 && (
          <Box marginLeft={2} marginBottom={1}>
            <Text color="gray">{currentMessage}</Text>
          </Box>
        )}

        {/* Progress bar */}
        <Box marginBottom={1}>
          <Text color={progress === 100 ? 'green' : 'cyan'}>[{progressBar}]</Text>
          <Text color="gray"> {progress}%</Text>
        </Box>

        {/* Detail message */}
        {detail && detail.length > 0 && (
          <Box marginBottom={1}>
            <Text color="gray">{detail}</Text>
          </Box>
        )}

        {isPaused && (
          <Box marginTop={1}>
            <Text color="yellow">⏸  PAUSED - Press [P] to resume</Text>
          </Box>
        )}

        {error && (
          <Box marginTop={1}>
            <Text color="red">✗ ERROR: {error}</Text>
          </Box>
        )}

        <Box marginTop={2}>
          <Text color="gray">Press [B] to go back • [Esc] to cancel</Text>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};
