import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';
import { collectFiles } from '../file-collector';
import { runSmartScan } from '../cli-scan-orchestrator';
import type { ScanMode } from '../cli-scan-orchestrator';

interface ScanProps {
  directory: string;
  mode: ScanMode;
  aiEnabled?: boolean;
  onComplete: (report: any) => void;
  onCancel: () => void;
}

export const Scan: React.FC<ScanProps> = ({
  directory,
  mode,
  aiEnabled = true,
  onComplete,
  onCancel,
}) => {
  const [phase, setPhase] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runActualScan = async () => {
      try {
        // Collect files
        setPhase('Collecting files');
        setProgress(5);
        setDetail(`Scanning directory: ${directory}`);
        
        const files = collectFiles(directory, undefined);
        
        if (cancelled) return;
        
        setDetail(`Found ${files.length} files to analyze`);
        setProgress(10);

        if (files.length === 0) {
          setError('No code files found in the directory');
          return;
        }

        // Run smart scan
        const { report, stats } = await runSmartScan(
          directory,
          files,
          0,
          (phaseMsg: string, pct: number, detailMsg?: string) => {
            if (!cancelled && !isPaused) {
              setPhase(phaseMsg);
              setProgress(pct);
              if (detailMsg) {
                setDetail(detailMsg);
              }
            }
          },
          mode,
          !aiEnabled
        );

        if (!cancelled) {
          setPhase('Complete');
          setProgress(100);
          setDetail('Scan complete');
          
          // Wait a moment before showing results
          setTimeout(() => {
            onComplete(report);
          }, 1000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Scan failed');
          setPhase('Error');
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

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            [?] SCANNING IN PROGRESS
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="white">Directory: </Text>
          <Text color="green">{directory}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="white">Mode: </Text>
          <Text color="yellow">{mode === 'quick' ? 'Quick Scan' : 'Deep Scan'}</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="white">AI Analysis: </Text>
          <Text color={aiEnabled ? 'green' : 'red'}>{aiEnabled ? 'Enabled' : 'Disabled'}</Text>
        </Box>

        <Box marginBottom={2} />

        <Box marginBottom={1}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text color="white"> {phase}</Text>
          <Text color="gray"> ({progress}%)</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color={progress === 100 ? 'green' : 'cyan'}>[{progressBar}]</Text>
        </Box>

        {detail && detail.length > 0 && (
          <Box marginBottom={1}>
            <Text color="gray">  {detail}</Text>
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
          <Text color="gray">Press [P] to pause • [B] to go back • [Esc] to cancel</Text>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};
