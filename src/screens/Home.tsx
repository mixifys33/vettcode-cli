import React from 'react';
import { Box, Text } from 'ink';
import { Header } from '../ui/Header';
import { StatsPanel } from '../ui/StatsPanel';
import { Capabilities } from '../ui/Capabilities';
import { QuickStart } from '../ui/QuickStart';
import { Menu } from '../ui/Menu';
import { ContextPanel } from '../ui/ContextPanel';
import { Footer } from '../ui/Footer';
import type { ScanMode } from '../cli-scan-orchestrator';

interface HomeProps {
  selectedMenuIndex: number;
  aiEnabled?: boolean;
  scanMode?: ScanMode;
}

const menuItems = [
  { label: 'Start Scan', shortcut: 'S' },
  { label: 'View Settings' },
  { label: 'Configure AI', shortcut: 'A' },
  { label: 'View Reports', shortcut: 'R' },
  { label: 'Documentation', shortcut: 'H' },
  { label: 'Exit', shortcut: 'Q' },
];

export const Home: React.FC<HomeProps> = ({ selectedMenuIndex, aiEnabled = true, scanMode = 'quick' }) => {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Header */}
      <Header />

      {/* Status Indicators */}
      <Box marginTop={1} marginBottom={1}>
        <Box marginRight={3}>
          <Text color="gray">Mode: </Text>
          <Text color={scanMode === 'deep' ? 'yellow' : 'cyan'} bold>
            {scanMode === 'deep' ? 'DEEP' : 'QUICK'}
          </Text>
        </Box>
        <Box>
          <Text color="gray">AI Analysis: </Text>
          <Text color={aiEnabled ? 'green' : 'red'} bold>
            {aiEnabled ? 'ENABLED' : 'DISABLED'}
          </Text>
        </Box>
      </Box>

      {/* Stats Panel */}
      <StatsPanel />

      {/* Divider */}
      <Box marginBottom={1} />

      {/* Main Content - Two Column Layout */}
      <Box flexDirection="row" marginBottom={1}>
        {/* Left Column - Capabilities */}
        <Capabilities />

        {/* Right Column - Quick Start + Menu + Context */}
        <Box flexDirection="column" width="55%">
          <QuickStart />
          <Box marginBottom={1} />
          <Menu selectedIndex={selectedMenuIndex} items={menuItems} />
          <Box marginTop={1} />
          <ContextPanel selectedMenuIndex={selectedMenuIndex} />
        </Box>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};
