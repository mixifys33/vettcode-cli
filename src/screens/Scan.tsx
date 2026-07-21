import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';

interface ScanProps {
  directory: string;
  mode: 'quick' | 'deep';
  onComplete: (report: any) => void;
  onCancel: () => void;
}

export const Scan: React.FC<ScanProps> = ({
  directory,
  mode,
  onComplete,
  onCancel,
}) => {
  const [phase, setPhase] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Simulated scan phases
    const phases = [
      { phase: 'Static analysis', pct: 25, detail: 'Pattern checks across files…' },
      { phase: 'Code extraction', pct: 45, detail: 'Targeting high-risk regions…' },
      { phase: 'AI review', pct: 75, detail: 'Analyzing extracted code…' },
      { phase: 'Verification', pct: 85, detail: 'Cross-checking findings…' },
      { phase: 'Complete', pct: 100, detail: 'Scan complete' },
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      if (!isPaused && currentPhase < phases.length) {
        const current = phases[currentPhase];
        setPhase(current.phase);
        setProgress(current.pct);
        setDetail(current.detail);
        currentPhase++;

        if (currentPhase === phases.length) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete({
              score: 75,
              grade: 'B',
              findings: [],
            });
          }, 1000);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, onComplete]);

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

        {detail && (
          <Box marginBottom={1}>
            <Text color="gray">  {detail}</Text>
          </Box>
        )}

        {isPaused && (
          <Box marginTop={1}>
            <Text color="yellow">⏸  PAUSED - Press [P] to resume</Text>
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
