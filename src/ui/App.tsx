import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Home } from '../screens/Home';
import { Scan } from '../screens/Scan';
import { Header } from './Header';
import { Footer } from './Footer';

type ViewState = 'home' | 'scan' | 'settings' | 'ai' | 'reports' | 'docs' | 'help';

const menuItems = ['scan', 'settings', 'ai', 'reports', 'docs', 'exit'];

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [scanDirectory, setScanDirectory] = useState<string | undefined>();
  const [showHelp, setShowHelp] = useState(false);

  const handleMenuSelect = (index: number) => {
    const selectedItem = menuItems[index];
    
    switch (selectedItem) {
      case 'scan':
        setScanDirectory(process.cwd());
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
    }
  };

  const goBack = () => {
    setView('home');
    setShowHelp(false);
  };

  useInput((input, key) => {
    if (showHelp) {
      if (input === 'h' || key.escape) {
        setShowHelp(false);
      }
      return;
    }

    if (view === 'home') {
      if (key.upArrow) {
        setSelectedMenuIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
      } else if (key.downArrow) {
        setSelectedMenuIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
      } else if (key.return) {
        handleMenuSelect(selectedMenuIndex);
      } else if (input === 's') {
        setScanDirectory(process.cwd());
        setView('scan');
      } else if (input === 'S') {
        setScanDirectory(undefined);
        setView('scan');
      } else if (input === 'q') {
        process.exit(0);
      } else if (input === 'r') {
        setView('reports');
      } else if (input === 'd') {
        setScanDirectory(undefined);
        setView('scan');
      } else if (input === 'a') {
        setView('ai');
      } else if (input === 'h') {
        setShowHelp(true);
      }
    } else if (view === 'scan') {
      if (input === 'b' || key.escape) {
        goBack();
      } else if (input === 'p') {
        // Pause/resume logic would go here
      } else if (input === 'e') {
        // Export logic would go here
      } else if (input === 'r') {
        setView('reports');
      }
    } else {
      if (input === 'b' || key.escape) {
        goBack();
      }
    }
  });

  if (showHelp) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Box flexDirection="column" marginTop={2}>
          <Text bold color="cyan">Keyboard Shortcuts</Text>
          <Text color="white" marginTop={1}>Navigation:</Text>
          <Text color="gray">  ↑/↓ - Navigate menu items</Text>
          <Text color="gray">  ←/→ - Switch between panels</Text>
          <Text color="gray">  Enter - Select active item</Text>
          <Text color="gray">  Esc - Cancel / Return to Home</Text>
          <Text color="white" marginTop={1}>Actions:</Text>
          <Text color="gray">  S - Start Smart Scan (current directory)</Text>
          <Text color="gray">  Shift+S - Start Manual Scan</Text>
          <Text color="gray">  Q - Exit application</Text>
          <Text color="gray">  R - View Reports</Text>
          <Text color="gray">  D - Change Scan Directory</Text>
          <Text color="gray">  F - Filter Scan Results</Text>
          <Text color="gray">  E - Export Results</Text>
          <Text color="gray">  A - Toggle AI Analysis</Text>
          <Text color="gray">  P - Pause/Resume Scan</Text>
          <Text color="gray">  C - Clear Current Results</Text>
          <Text color="gray">  B - Go Back</Text>
          <Text color="gray">  H - Show Help</Text>
          <Text color="gray" dimColor marginTop={1}>Press H or Esc to close</Text>
        </Box>
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  if (view === 'home') {
    return <Home selectedMenuIndex={selectedMenuIndex} onMenuSelect={handleMenuSelect} />;
  }

  if (view === 'scan') {
    return <Scan onBack={goBack} directory={scanDirectory} />;
  }

  if (view === 'settings') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Settings View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press B or ESC to return to menu
        </Text>
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  if (view === 'ai') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">AI Configuration View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press B or ESC to return to menu
        </Text>
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  if (view === 'reports') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Reports View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press B or ESC to return to menu
        </Text>
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  if (view === 'docs') {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Header />
        <Text color="yellow">Documentation View - Coming Soon</Text>
        <Text color="gray" dimColor>
          Press B or ESC to return to menu
        </Text>
        <Box marginTop={2}>
          <Footer />
        </Box>
      </Box>
    );
  }

  return null;
};
