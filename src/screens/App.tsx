import React, { useState, useEffect } from 'react';
import { useInput, useApp } from 'ink';
import { Home } from './Home';
import { Scan } from './Scan';
import { Results } from './Results';
import { Help } from './Help';

type Screen = 'home' | 'scan' | 'results' | 'help' | 'exit';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [scanDirectory, setScanDirectory] = useState(process.cwd());
  const [scanMode, setScanMode] = useState<'quick' | 'deep'>('quick');
  const [scanReport, setScanReport] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const { exit } = useApp();

  // Handle keyboard input
  useInput((input, key) => {
    // Global shortcuts
    if (input === 'q' || input === 'Q') {
      // Confirm exit
      if (screen === 'home') {
        exit();
      } else {
        setScreen('home');
      }
      return;
    }

    if (input === 'h' || input === 'H') {
      setScreen('help');
      return;
    }

    if (input === 'b' || input === 'B') {
      if (screen !== 'home') {
        setScreen('home');
      }
      return;
    }

    if (key.escape) {
      setScreen('home');
      return;
    }

    // Home screen shortcuts
    if (screen === 'home') {
      if (input === 's' || input === 'S') {
        // Start Smart Scan (auto-detect current directory)
        setScanDirectory(process.cwd());
        setScanMode('quick');
        setScreen('scan');
        return;
      }

      if (key.shift && input === 'S') {
        // Start Manual Scan (prompt for directory)
        // For now, use current directory
        setScanDirectory(process.cwd());
        setScanMode('deep');
        setScreen('scan');
        return;
      }

      if (input === 'r' || input === 'R') {
        // View Reports
        if (scanReport) {
          setScreen('results');
        }
        return;
      }

      if (input === 'a' || input === 'A') {
        // Toggle AI mode
        setAiEnabled(!aiEnabled);
        return;
      }

      // Arrow key navigation
      if (key.upArrow) {
        setSelectedMenuIndex((prev) => (prev > 0 ? prev - 1 : 5));
        return;
      }

      if (key.downArrow) {
        setSelectedMenuIndex((prev) => (prev < 5 ? prev + 1 : 0));
        return;
      }

      // Enter key - Select menu item
      if (key.return) {
        switch (selectedMenuIndex) {
          case 0: // Start Scan
            setScanDirectory(process.cwd());
            setScanMode('quick');
            setScreen('scan');
            break;
          case 1: // View Settings
            // TODO: Implement settings screen
            break;
          case 2: // Configure AI
            setAiEnabled(!aiEnabled);
            break;
          case 3: // View Reports
            if (scanReport) {
              setScreen('results');
            }
            break;
          case 4: // Documentation
            setScreen('help');
            break;
          case 5: // Exit
            exit();
            break;
        }
        return;
      }
    }

    // Results screen shortcuts
    if (screen === 'results') {
      if (input === 'e' || input === 'E') {
        // Export results
        console.log('Export functionality coming soon...');
        return;
      }
    }

    // Scan screen shortcuts
    if (screen === 'scan') {
      if (input === 'p' || input === 'P') {
        // Pause/Resume scan
        // TODO: Implement pause functionality
        return;
      }
    }
  });

  const handleScanComplete = (report: any) => {
    setScanReport(report);
    setScreen('results');
  };

  const handleScanCancel = () => {
    setScreen('home');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleBack = () => {
    setScreen('home');
  };

  // Render current screen
  switch (screen) {
    case 'home':
      return <Home selectedMenuIndex={selectedMenuIndex} />;

    case 'scan':
      return (
        <Scan
          directory={scanDirectory}
          mode={scanMode}
          onComplete={handleScanComplete}
          onCancel={handleScanCancel}
        />
      );

    case 'results':
      return (
        <Results
          report={scanReport || { score: 0, grade: 'F', findings: [], criticalBlockers: [], strengths: [] }}
          onBack={handleBack}
          onExport={handleExport}
        />
      );

    case 'help':
      return <Help onBack={handleBack} />;

    default:
      return <Home selectedMenuIndex={selectedMenuIndex} />;
  }
};
