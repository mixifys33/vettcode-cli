import React from 'react';
import { Box, Text } from 'ink';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';

interface HelpProps {
  onBack: () => void;
}

export const Help: React.FC<HelpProps> = ({ onBack }) => {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            ⌨️  KEYBOARD SHORTCUTS
          </Text>
        </Box>

        <Box flexDirection="row" marginBottom={2}>
          <Box flexDirection="column" width="50%">
            <Box marginBottom={0}>
              <Text bold color="green">
                S
              </Text>
              <Text color="gray"> → Start Smart Scan</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                Shift+S
              </Text>
              <Text color="gray"> → Start Manual Scan</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                Q
              </Text>
              <Text color="gray"> → Exit Application</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                R
              </Text>
              <Text color="gray"> → View Reports</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                D
              </Text>
              <Text color="gray"> → Change Directory</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                F
              </Text>
              <Text color="gray"> → Filter Results</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                E
              </Text>
              <Text color="gray"> → Export Results</Text>
            </Box>
          </Box>

          <Box flexDirection="column" width="50%">
            <Box marginBottom={0}>
              <Text bold color="green">
                A
              </Text>
              <Text color="gray"> → Toggle AI Mode</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                P
              </Text>
              <Text color="gray"> → Pause/Resume Scan</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                C
              </Text>
              <Text color="gray"> → Clear Results</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                B
              </Text>
              <Text color="gray"> → Go Back</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                H
              </Text>
              <Text color="gray"> → Show Help</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                ↑↓
              </Text>
              <Text color="gray"> → Navigate Menu</Text>
            </Box>
            <Box marginBottom={0}>
              <Text bold color="green">
                Enter
              </Text>
              <Text color="gray"> → Select/Confirm</Text>
            </Box>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color="gray">Press [B] to go back • [Esc] to return home</Text>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};
