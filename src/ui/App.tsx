import React, { useState } from 'react';
import { Box, render, Text } from 'ink';
import { Header } from './Header';
import { StatsPanel } from './StatsPanel';
import { Capabilities } from './Capabilities';
import { Menu } from './Menu';
import { Footer } from './Footer';

type ViewState = 'home' | 'scan' | 'settings' | 'ai' | 'reports' | 'docs';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');

  const handleMenuSelect = (item: string) => {
    switch (item) {
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
      <Box flexDirection="column" padding={1}>
        <Header />
        <Box flexDirection="row" marginBottom={1}>
          <Box width={40}>
            <StatsPanel />
          </Box>
        </Box>
        <Box flexDirection="row">
          <Box width={40}>
            <Capabilities />
          </Box>
          <Box width={40} paddingLeft={2}>
            <Text bold color="white" marginBottom={1}>
              Quick Start
            </Text>
            <Text color="gray" dimColor>
              vettcode {'<directory>'}
            </Text>
            <Text color="gray" dimColor>
              vettcode --mode deep
            </Text>
            <Text color="gray" dimColor>
              vettcode --no-ai
            </Text>
            <Box marginTop={1}>
              <Menu onSelect={handleMenuSelect} />
            </Box>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (view === 'scan') {
    return (
      <Box flexDirection="column" padding={1}>
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
      <Box flexDirection="column" padding={1}>
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
      <Box flexDirection="column" padding={1}>
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
      <Box flexDirection="column" padding={1}>
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
      <Box flexDirection="column" padding={1}>
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
