import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Header } from './Header';
import { StatsPanel } from './StatsPanel';
import { Capabilities } from './Capabilities';
import { Menu } from './Menu';
import { Footer } from './Footer';
import { execSync } from 'child_process';

type ViewState = 'home' | 'scan' | 'settings' | 'ai' | 'reports' | 'docs';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');

  const handleMenuSelect = (item: string) => {
    switch (item) {
      case 'scan-current':
        const currentDir = process.cwd();
        try {
          execSync(`node dist/cli.js "${currentDir}"`, { stdio: 'inherit' });
        } catch (error) {
          console.error('Scan failed');
        }
        process.exit(0);
        break;
      case 'scan':
        setView('scan');
        break;
      case 'settings':
        setView('settings');
        break;
      case 'ai':
        setView('ai');
        break;
      case 'reports':
        setView('reports');
        break;
      case 'docs':
        setView('docs');
        break;
      case 'exit':
        process.exit(0);
        break;
    }
  };

  if (view === 'home') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        {/* Top Row: Header (Left) + Stats Panel (Right) */}
        <Box flexDirection="row" justifyContent="space-between" marginBottom={2}>
          <Box width={50}>
            <Header />
          </Box>
          <Box width={50}>
            <StatsPanel />
          </Box>
        </Box>

        {/* Main Body: Capabilities (Left) + Interaction Panel (Right) */}
        <Box flexDirection="row" justifyContent="space-between" flexGrow={1}>
          <Box width={50} paddingRight={2}>
            <Capabilities />
          </Box>
          <Box width={50} paddingLeft={2}>
            <Menu onSelect={handleMenuSelect} />
          </Box>
        </Box>

        {/* Footer */}
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  if (view === 'scan') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Scan View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press ESC to return to menu
        </Text>
      </Box>
    );
  }

  if (view === 'settings') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Settings View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press ESC to return to menu
        </Text>
      </Box>
    );
  }

  if (view === 'ai') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">AI Configuration View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press ESC to return to menu
        </Text>
      </Box>
    );
  }

  if (view === 'reports') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Reports View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press ESC to return to menu
        </Text>
      </Box>
    );
  }

  if (view === 'docs') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Documentation View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press ESC to return to menu
        </Text>
      </Box>
    );
  }

  return null;
};
