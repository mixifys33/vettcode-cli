import React, { useState } from 'react';
import { useInput, useApp } from 'ink';
import { Home } from './Home';
import { Scan } from './Scan';
import { Results } from './Results';
import { Help } from './Help';
import { Settings } from './Settings';
import type { ScanMode } from '../cli-scan-orchestrator';

type Screen = 'home' | 'scan' | 'results' | 'help' | 'settings' | 'exit';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [selectedSettingIndex, setSelectedSettingIndex] = useState(0);
  const [scanDirectory, setScanDirectory] = useState(process.cwd());
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
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
        setScreen('scan'); // Go directly to scan
        return;
      }

      if (key.shift && input === 'S') {
        // Start Manual Scan (go to settings first)
        setScreen('settings');
        return;
      }

      if (input === 'd' || input === 'D') {
        // Change directory (for now just show settings)
        setScreen('settings');
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
            setScreen('scan'); // Go directly to scan with current settings
            break;
          case 1: // View Settings
            setScreen('settings');
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

    // Settings screen shortcuts
    if (screen === 'settings') {
      // Arrow key navigation
      if (key.upArrow) {
        setSelectedSettingIndex((prev) => (prev > 0 ? prev - 1 : 3));
        return;
      }

      if (key.downArrow) {
        setSelectedSettingIndex((prev) => (prev < 3 ? prev + 1 : 0));
        return;
      }

      // Enter key - Toggle or start scan
      if (key.return) {
        switch (selectedSettingIndex) {
          case 0: // Toggle scan mode
            setScanMode((prev) => (prev === 'quick' ? 'deep' : 'quick'));
            break;
          case 1: // Toggle AI
            setAiEnabled((prev) => !prev);
            break;
          case 2: // Change directory (for now, do nothing)
            // TODO: Implement directory picker
            break;
          case 3: // Start scan
            setScreen('scan');
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
      return <Home selectedMenuIndex={selectedMenuIndex} aiEnabled={aiEnabled} scanMode={scanMode} />;

    case 'scan':
      return (
        <Scan
          directory={scanDirectory}
          mode={scanMode}
          aiEnabled={aiEnabled}
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

    case 'settings':
      return (
        <Settings
          scanMode={scanMode}
          aiEnabled={aiEnabled}
          scanDirectory={scanDirectory}
          selectedOption={selectedSettingIndex}
          onBack={handleBack}
        />
      );

    default:
      return <Home selectedMenuIndex={selectedMenuIndex} aiEnabled={aiEnabled} scanMode={scanMode} />;
  }
};
