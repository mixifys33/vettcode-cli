import React from 'react';
import { Box, Text } from 'ink';
import { Header } from '../ui/Header';
import { Footer } from '../ui/Footer';
import type { ScanMode } from '../cli-scan-orchestrator';

interface SettingsProps {
  scanMode: ScanMode;
  aiEnabled: boolean;
  scanDirectory: string;
  selectedOption: number;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  scanMode,
  aiEnabled,
  scanDirectory,
  selectedOption,
  onBack,
}) => {
  const options = [
    { label: 'Scan Mode', value: scanMode === 'quick' ? 'Quick Scan' : 'Deep Scan' },
    { label: 'AI Analysis', value: aiEnabled ? 'Enabled' : 'Disabled' },
    { label: 'Target Directory', value: scanDirectory },
    { label: 'Start Scan', value: '→ Begin scanning with current settings' },
  ];

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Header />

      <Box flexDirection="column" marginTop={2} marginBottom={2}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {'['}&gt;{']'} SCAN CONFIGURATION
          </Text>
        </Box>

        <Box marginBottom={2}>
          <Text color="gray">
            Configure your scan settings before starting. Use arrow keys to navigate and Enter to change.
          </Text>
        </Box>

        {/* Settings Options */}
        <Box flexDirection="column" marginBottom={2}>
          {options.map((option, index) => {
            const isSelected = index === selectedOption;
            const isStartButton = index === 3;

            return (
              <Box key={index} marginBottom={1}>
                <Box minWidth={20}>
                  <Text color={isSelected ? 'cyan' : 'white'}>
                    {isSelected ? '> ' : '  '}
                    {option.label}:
                  </Text>
                </Box>
                <Box marginLeft={2}>
                  <Text
                    color={
                      isStartButton
                        ? 'green'
                        : isSelected
                        ? 'cyan'
                        : 'gray'
                    }
                    bold={isStartButton}
                  >
                    {option.value}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Help Text */}
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="gray"
          paddingX={2}
          paddingY={1}
          marginBottom={2}
        >
          <Text bold color="cyan">
            {'['}&gt;{']'} Configuration Help
          </Text>
          <Box marginTop={1}>
            {selectedOption === 0 && (
              <Box flexDirection="column">
                <Text color="white">Scan Mode Options:</Text>
                <Text color="gray">  • Quick: Scans priority files (~30s)</Text>
                <Text color="gray">  • Deep: Comprehensive scan (~2-3 min)</Text>
                <Text color="yellow" marginTop={1}>
                  Press [Enter] to toggle between Quick/Deep
                </Text>
              </Box>
            )}
            {selectedOption === 1 && (
              <Box flexDirection="column">
                <Text color="white">AI Analysis:</Text>
                <Text color="gray">  • Enabled: Uses AI for deeper analysis</Text>
                <Text color="gray">  • Disabled: Static analysis only (faster)</Text>
                <Text color="yellow" marginTop={1}>
                  Press [Enter] to toggle AI on/off
                </Text>
              </Box>
            )}
            {selectedOption === 2 && (
              <Box flexDirection="column">
                <Text color="white">Target Directory:</Text>
                <Text color="gray">  Current: {scanDirectory}</Text>
                <Text color="yellow" marginTop={1}>
                  Press [D] from home to change directory
                </Text>
              </Box>
            )}
            {selectedOption === 3 && (
              <Box flexDirection="column">
                <Text color="green" bold>
                  Ready to scan!
                </Text>
                <Text color="gray">
                  Current settings: {scanMode.toUpperCase()} mode, AI {aiEnabled ? 'ON' : 'OFF'}
                </Text>
                <Text color="yellow" marginTop={1}>
                  Press [Enter] to start scanning
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* Keyboard Shortcuts */}
        <Box marginTop={1}>
          <Text color="gray">
            Press [↑↓] to navigate • [Enter] to select/toggle • [B] to go back • [Q] to quit
          </Text>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};
