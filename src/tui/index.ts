#!/usr/bin/env node

import blessed from 'blessed';
import chalk from 'chalk';
import { collectFiles } from '../file-collector';
import { runSmartScan } from '../cli-scan-orchestrator';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from the correct directory
const envPath = path.resolve(__dirname, '../../.env');
const altEnvPath = path.resolve(__dirname, '../../../Vettcode-engine-cli/.env');

// Try both possible locations
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`[TUI] Loading .env from: ${envPath}`);
} else if (fs.existsSync(altEnvPath)) {
  dotenv.config({ path: altEnvPath });
  console.log(`[TUI] Loading .env from: ${altEnvPath}`);
} else {
  console.log(`[TUI] .env not found at: ${envPath} or ${altEnvPath}`);
}

// Debug: Log what API keys are found
console.log(`[TUI] OPENROUTER_API_KEYS: ${process.env.OPENROUTER_API_KEYS ? 'SET' : 'NOT SET'}`);
console.log(`[TUI] OPENROUTER_API_KEY_1: ${process.env.OPENROUTER_API_KEY_1 ? 'SET' : 'NOT SET'}`);
console.log(`[TUI] OPENROUTER_API_KEY_2: ${process.env.OPENROUTER_API_KEY_2 ? 'SET' : 'NOT SET'}`);
console.log(`[TUI] OPENROUTER_API_KEY_3: ${process.env.OPENROUTER_API_KEY_3 ? 'SET' : 'NOT SET'}`);

// Create screen with enhanced styling
const screen = blessed.screen({
  smartCSR: true,
  title: 'VettCode CLI',
  fullUnicode: true,
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: 'cyan',
  },
  style: {
    bg: 'black',
  },
});

// Animation variables
let animationFrame = 0;
let isAnimating = false;

// Animated border colors
const borderColors = ['cyan', 'blue', 'magenta', 'cyan'];

// Update border colors periodically
function animateBorders() {
  if (!isAnimating) return;
  
  animationFrame = (animationFrame + 1) % borderColors.length;
  const color = borderColors[animationFrame];
  
  headerBox.style.border.fg = color;
  statsBox.style.border.fg = color;
  capabilitiesBox.style.border.fg = color;
  quickStartBox.style.border.fg = color;
  menuBox.style.border.fg = color;
  descriptionBox.style.border.fg = color;
  
  screen.render();
  setTimeout(animateBorders, 500);
}

// Menu items
const menuItems = [
  { label: 'Start Scan', value: 'scan', description: 'Run a deep security and quality analysis on your project directory.' },
  { label: 'View Settings', value: 'settings', description: 'Configure scan options, ignore patterns, and output preferences.' },
  { label: 'Configure AI', value: 'ai', description: 'Set up AI-enhanced analysis with your API keys and model preferences.' },
  { label: 'View Reports', value: 'reports', description: 'View previous scan reports and historical analysis data.' },
  { label: 'Documentation', value: 'docs', description: 'Access documentation, usage guides, and command reference.' },
  { label: 'Exit', value: 'exit', description: 'Exit VettCode CLI and return to terminal.' },
];

let selectedIndex = 0;
let currentView = 'home';
let scanDirectoryIndex = 0;
let scanModeIndex = 0;
let selectedDirectory = '';
let selectedScanMode = '';
let scanProgress = 0;
let scanPhase = '';
let scanDetail = '';
let isScanning = false;

// Scan directory options
const directoryOptions = [
  { label: 'Current Directory', value: 'current', description: 'Scan the current working directory' },
  { label: 'Custom Directory', value: 'custom', description: 'Enter a custom directory path to scan' },
];

// Scan mode options
const scanModeOptions = [
  { label: 'Deep Scan', value: 'deep', description: 'Uses 48 segmented AI workers for comprehensive analysis' },
  { label: 'Quick Scan', value: 'quick', description: 'Uses 12 segmented AI workers for faster analysis' },
];

// Header box
const headerBox = blessed.box({
  top: 0,
  left: 0,
  width: '50%',
  height: 5,
  content: `{bold}{cyan-fg}VettCode{/cyan-fg}{blue-fg} CLI{/blue-fg}\n\nEnterprise-Grade Code Security Scanner\n{gray-fg}Advanced static analysis powered by AI{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Stats panel
const statsBox = blessed.box({
  top: 0,
  right: 0,
  width: '50%',
  height: 5,
  content: `{yellow-fg}[SEC]{/yellow-fg} {bold}350+ Security Patterns{/bold} {gray-fg}— Comprehensive detection{/gray-fg}\n{yellow-fg}[AI]{/yellow-fg} {bold}AI-Powered Analysis{/bold} {gray-fg}— Deep semantic reasoning{/gray-fg}\n{yellow-fg}[OK]{/yellow-fg} {bold}<3% False Positives{/bold} {gray-fg}— Multi-layer verification{/gray-fg}\n{yellow-fg}[SHIELD]{/yellow-fg} {bold}Multi-Layer Verification{/bold} {gray-fg}— Cross-validation system{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Capabilities panel
const capabilitiesBox = blessed.box({
  top: 5,
  left: 0,
  width: '50%',
  height: 12,
  content: `{bold}{white-fg}Capabilities{/white-fg}\n\n{red-fg}[!]{/red-fg} {bold}Vulnerability Detection{/bold} {gray-fg}— SQLi, XSS, Command Injection, Secrets{/gray-fg}\n{yellow-fg}[*]{/yellow-fg} {bold}Code Quality Analysis{/bold} {gray-fg}— Magic numbers, deep nesting, dead code{/gray-fg}\n{blue-fg}[DB]{/blue-fg} {bold}Database Security{/bold} {gray-fg}— N+1 queries, connection limits, timeouts{/gray-fg}\n{green-fg}[+]{/green-fg} {bold}Advanced Analysis{/bold} {gray-fg}— Data flow, control flow, reference graph{/gray-fg}\n{cyan-fg}[>]{/cyan-fg} {bold}Smart Reporting{/bold} {gray-fg}— Scoring, actionable insights, executive verdict{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Quick start box
const quickStartBox = blessed.box({
  top: 5,
  right: 0,
  width: '50%',
  height: 6,
  content: `{bold}{white-fg}Quick Start{/white-fg}\n\n{gray-fg}vettcode <directory>{/gray-fg}\n{gray-fg}vettcode --mode deep{/gray-fg}\n{gray-fg}vettcode --no-ai{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Menu box
const menuBox = blessed.box({
  top: 11,
  right: 0,
  width: '50%',
  height: 6,
  content: `{bold}{white-fg}Main Menu{/white-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Description box
const descriptionBox = blessed.box({
  top: 17,
  right: 0,
  width: '50%',
  height: 5,
  content: `{bold}{white-fg}Description{/white-fg}\n\n{gray-fg}${menuItems[0].description}{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'cyan' },
  },
});

// Footer
const footerBox = blessed.box({
  bottom: 0,
  right: 0,
  width: '50%',
  height: 3,
  content: `{gray-fg}Powered by AD-Technologies and AI Enterprises{/gray-fg}\n{gray-fg}Special thanks: Masereka Adorable, Hacker X{/gray-fg}`,
  tags: true,
  style: {
    fg: 'gray',
  },
});

// Help overlay
const helpBox = blessed.box({
  top: 'center',
  left: 'center',
  width: '80%',
  height: '70%',
  content: `{bold}{cyan-fg}Keyboard Shortcuts{/cyan-fg}\n\n{white-fg}Navigation:{/white-fg}\n{gray-fg}  ↑/↓ - Navigate menu items{/gray-fg}\n{gray-fg}  ←/→ - Switch between panels{/gray-fg}\n{gray-fg}  Enter - Select active item{/gray-fg}\n{gray-fg}  Esc - Cancel / Return to Home{/gray-fg}\n\n{white-fg}Actions:{/white-fg}\n{gray-fg}  S - Start Smart Scan (current directory){/gray-fg}\n{gray-fg}  Shift+S - Start Manual Scan{/gray-fg}\n{gray-fg}  Q - Exit application{/gray-fg}\n{gray-fg}  R - View Reports{/gray-fg}\n{gray-fg}  D - Change Scan Directory{/gray-fg}\n{gray-fg}  F - Filter Scan Results{/gray-fg}\n{gray-fg}  E - Export Results{/gray-fg}\n{gray-fg}  A - Toggle AI Analysis{/gray-fg}\n{gray-fg}  P - Pause/Resume Scan{/gray-fg}\n{gray-fg}  C - Clear Current Results{/gray-fg}\n{gray-fg}  B - Go Back{/gray-fg}\n{gray-fg}  H - Show Help{/gray-fg}\n\n{gray-fg}Press H or Esc to close{/gray-fg}`,
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'blue',
    border: { fg: 'cyan' },
  },
  hidden: true,
});

// Append elements to screen
screen.append(headerBox);
screen.append(statsBox);
screen.append(capabilitiesBox);
screen.append(quickStartBox);
screen.append(menuBox);
screen.append(descriptionBox);
screen.append(footerBox);
screen.append(helpBox);

// Update menu display
function updateMenu() {
  let menuContent = `{bold}{white-fg}Main Menu{/white-fg}\n\n`;
  menuItems.forEach((item, index) => {
    const prefix = index === selectedIndex ? `{cyan-fg}→ {/cyan-fg}` : '  ';
    const color = index === selectedIndex ? '{cyan-fg}{bold}' : '{gray-fg}';
    menuContent += `${prefix}${color}${item.label}{/${color}}\n`;
  });
  menuBox.setContent(menuContent);
  
  // Update description
  descriptionBox.setContent(`{bold}{white-fg}Description{/white-fg}\n\n{gray-fg}${menuItems[selectedIndex].description}{/gray-fg}`);
  
  screen.render();
}

// Initial menu render
updateMenu();

// Start border animation
isAnimating = true;
animateBorders();

// Keyboard input handling
screen.key(['up', 'down'], (ch, key) => {
  if (currentView === 'home' && !helpBox.hidden) {
    if (key.name === 'up' || key.name === 'down') {
      helpBox.hide();
      screen.render();
    }
    return;
  }

  if (currentView === 'home') {
    if (key.name === 'up') {
      selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
      updateMenu();
    } else if (key.name === 'down') {
      selectedIndex = (selectedIndex + 1) % menuItems.length;
      updateMenu();
    }
  } else if (currentView === 'scan-directory') {
    if (key.name === 'up') {
      scanDirectoryIndex = (scanDirectoryIndex - 1 + directoryOptions.length) % directoryOptions.length;
      updateDirectoryMenu();
    } else if (key.name === 'down') {
      scanDirectoryIndex = (scanDirectoryIndex + 1) % directoryOptions.length;
      updateDirectoryMenu();
    }
  } else if (currentView === 'scan-mode') {
    if (key.name === 'up') {
      scanModeIndex = (scanModeIndex - 1 + scanModeOptions.length) % scanModeOptions.length;
      updateScanModeMenu();
    } else if (key.name === 'down') {
      scanModeIndex = (scanModeIndex + 1) % scanModeOptions.length;
      updateScanModeMenu();
    }
  }
});

screen.key(['enter'], () => {
  if (currentView === 'home' && !helpBox.hidden) {
    helpBox.hide();
    screen.render();
    return;
  }

  if (currentView === 'home') {
    const selectedItem = menuItems[selectedIndex];
    if (selectedItem.value === 'exit') {
      process.exit(0);
    } else if (selectedItem.value === 'scan') {
      currentView = 'scan-directory';
      scanDirectoryIndex = 0;
      showDirectorySelection();
    } else {
      // Show placeholder for other options
      showPlaceholderScreen(selectedItem.label);
    }
  } else if (currentView === 'scan-directory') {
    const selectedDir = directoryOptions[scanDirectoryIndex];
    selectedDirectory = selectedDir.value;
    if (selectedDir.value === 'current') {
      selectedDirectory = process.cwd();
      currentView = 'scan-mode';
      scanModeIndex = 0;
      showScanModeSelection();
    } else {
      // For custom directory, we would need text input - for now skip to mode
      selectedDirectory = process.cwd();
      currentView = 'scan-mode';
      scanModeIndex = 0;
      showScanModeSelection();
    }
  } else if (currentView === 'scan-mode') {
    const selectedMode = scanModeOptions[scanModeIndex];
    selectedScanMode = selectedMode.value;
    currentView = 'scan-executing';
    showScanExecuting();
  }
});

screen.key(['escape'], () => {
  if (!helpBox.hidden) {
    helpBox.hide();
    screen.render();
  } else if (currentView === 'scan-results') {
    currentView = 'home';
    showHomeScreen();
  } else if (currentView === 'scan-executing') {
    if (isScanning) {
      isScanning = false;
      scanPhase = 'Cancelled';
      scanDetail = 'Scan cancelled by user';
      updateScanProgress();
    }
    currentView = 'home';
    showHomeScreen();
  } else if (currentView === 'scan-mode') {
    currentView = 'scan-directory';
    showDirectorySelection();
  } else if (currentView === 'scan-directory') {
    currentView = 'home';
    showHomeScreen();
  } else if (currentView !== 'home') {
    currentView = 'home';
    showHomeScreen();
  }
});

screen.key(['s', 'S'], (ch, key) => {
  if (currentView === 'home') {
    currentView = 'scan';
    showScanScreen();
  }
});

screen.key(['q'], () => {
  process.exit(0);
});

screen.key(['r'], () => {
  if (currentView === 'home') {
    showPlaceholderScreen('View Reports');
  }
});

screen.key(['d'], () => {
  if (currentView === 'home') {
    currentView = 'scan';
    showScanScreen();
  }
});

screen.key(['a'], () => {
  if (currentView === 'home') {
    showPlaceholderScreen('Configure AI');
  }
});

screen.key(['h', 'H'], () => {
  if (currentView === 'home') {
    helpBox.show();
    screen.render();
  }
});

screen.key(['b', 'B'], () => {
  if (currentView === 'scan-results') {
    currentView = 'home';
    showHomeScreen();
  } else if (currentView === 'scan-executing') {
    if (isScanning) {
      isScanning = false;
      scanPhase = 'Cancelled';
      scanDetail = 'Scan cancelled by user';
      updateScanProgress();
    }
    currentView = 'home';
    showHomeScreen();
  } else if (currentView === 'scan-mode') {
    currentView = 'scan-directory';
    showDirectorySelection();
  } else if (currentView === 'scan-directory') {
    currentView = 'home';
    showHomeScreen();
  } else if (currentView !== 'home') {
    currentView = 'home';
    showHomeScreen();
  }
});

function showHomeScreen() {
  currentView = 'home';
  headerBox.show();
  statsBox.show();
  capabilitiesBox.show();
  quickStartBox.show();
  menuBox.show();
  descriptionBox.show();
  footerBox.show();
  helpBox.hide();
  isAnimating = true;
  screen.render();
}

function showPlaceholderScreen(title: string) {
  currentView = 'placeholder';
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.hide();
  descriptionBox.setContent(`{bold}{yellow-fg}${title} - Coming Soon{/yellow-fg}\n\n{gray-fg}Press B or ESC to return to menu{/gray-fg}`);
  descriptionBox.show();
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  screen.render();
}

function showScanScreen() {
  currentView = 'scan';
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.hide();
  descriptionBox.setContent(`{bold}{yellow-fg}Scan View{/yellow-fg}\n\n{gray-fg}Ready to scan current directory{/gray-fg}\n{gray-fg}Press S to start scan or B to go back{/gray-fg}`);
  descriptionBox.show();
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  screen.render();
}

function updateDirectoryMenu() {
  let menuContent = `{bold}{white-fg}Select Directory{/white-fg}\n\n`;
  directoryOptions.forEach((item, index) => {
    const prefix = index === scanDirectoryIndex ? `{cyan-fg}→ {/cyan-fg}` : '  ';
    const color = index === scanDirectoryIndex ? '{cyan-fg}{bold}' : '{gray-fg}';
    menuContent += `${prefix}${color}${item.label}{/${color}}\n`;
  });
  menuBox.setContent(menuContent);
  
  descriptionBox.setContent(`{bold}{white-fg}Description{/white-fg}\n\n{gray-fg}${directoryOptions[scanDirectoryIndex].description}{/gray-fg}`);
  
  screen.render();
}

function showDirectorySelection() {
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.show();
  menuBox.top = 11;
  menuBox.height = 6;
  descriptionBox.show();
  descriptionBox.top = 17;
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  updateDirectoryMenu();
}

function updateScanModeMenu() {
  let menuContent = `{bold}{white-fg}Select Scan Mode{/white-fg}\n\n`;
  scanModeOptions.forEach((item, index) => {
    const prefix = index === scanModeIndex ? `{cyan-fg}→ {/cyan-fg}` : '  ';
    const color = index === scanModeIndex ? '{cyan-fg}{bold}' : '{gray-fg}';
    menuContent += `${prefix}${color}${item.label}{/${color}}\n`;
  });
  menuBox.setContent(menuContent);
  
  descriptionBox.setContent(`{bold}{white-fg}Description{/white-fg}\n\n{gray-fg}${scanModeOptions[scanModeIndex].description}{/gray-fg}`);
  
  screen.render();
}

function showScanModeSelection() {
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.show();
  menuBox.top = 11;
  menuBox.height = 6;
  descriptionBox.show();
  descriptionBox.top = 17;
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  updateScanModeMenu();
}

function showScanExecuting() {
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.hide();
  descriptionBox.show();
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  
  // Start actual scan
  isScanning = true;
  scanProgress = 0;
  scanPhase = 'Initializing...';
  scanDetail = '';
  
  updateScanProgress();
  
  // Run the scan in background
  runActualScan();
}

function updateScanProgress() {
  if (!isScanning) return;
  
  const progressBar = `[${'█'.repeat(Math.floor(scanProgress / 5))}${'░'.repeat(20 - Math.floor(scanProgress / 5))}]`;
  
  descriptionBox.setContent(
    `{bold}{green-fg}Scan in Progress{/green-fg}\n\n` +
    `{white-fg}Directory: {/white-fg}{cyan-fg}${selectedDirectory.substring(0, 40)}${selectedDirectory.length > 40 ? '...' : ''}{/cyan-fg}\n` +
    `{white-fg}Mode: {/white-fg}{cyan-fg}${selectedScanMode.toUpperCase()}{/cyan-fg}\n` +
    `{white-fg}AI Workers: {/white-fg}{cyan-fg}${selectedScanMode === 'deep' ? '48' : '12'} Segmented{/cyan-fg}\n\n` +
    `{white-fg}Phase: {/white-fg}{yellow-fg}${scanPhase}{/yellow-fg}\n` +
    `{white-fg}Progress: {/white-fg}{cyan-fg}${scanProgress}%{/cyan-fg}\n` +
    `{cyan-fg}${progressBar}{/cyan-fg}\n` +
    `${scanDetail ? `{gray-fg}${scanDetail}{/gray-fg}\n` : ''}` +
    `{gray-fg}Press B to cancel{/gray-fg}`
  );
  
  screen.render();
}

async function runActualScan() {
  try {
    // Validate directory
    if (!fs.existsSync(selectedDirectory)) {
      scanPhase = 'Error';
      scanDetail = 'Directory not found';
      isScanning = false;
      updateScanProgress();
      return;
    }

    // Collect files
    scanPhase = 'Collecting files...';
    scanProgress = 5;
    updateScanProgress();
    
    const files = collectFiles(selectedDirectory);
    scanProgress = 15;
    scanDetail = `Found ${files.length} files`;
    updateScanProgress();

    if (files.length === 0) {
      scanPhase = 'Complete';
      scanProgress = 100;
      scanDetail = 'No files found to scan';
      isScanning = false;
      updateScanProgress();
      return;
    }

    const projectName = path.basename(selectedDirectory);
    const scanMode = selectedScanMode as 'quick' | 'deep';

    // Run smart scan with progress callback
    scanPhase = 'Running analysis...';
    scanProgress = 20;
    updateScanProgress();

    const { report, stats } = await runSmartScan(
      projectName,
      files,
      0,
      (phase, pct, detail) => {
        scanPhase = phase;
        scanProgress = pct;
        scanDetail = detail || '';
        updateScanProgress();
      },
      scanMode
    );

    // Scan complete
    isScanning = false;
    scanPhase = 'Complete';
    scanProgress = 100;
    scanDetail = `Found ${stats.verifiedFindings} issues`;
    updateScanProgress();
    
    // Show results
    setTimeout(() => {
      showScanResults(report, stats);
    }, 2000);

  } catch (error) {
    isScanning = false;
    scanPhase = 'Error';
    scanDetail = error instanceof Error ? error.message : 'Unknown error';
    scanProgress = 0;
    updateScanProgress();
  }
}

function showScanResults(report: any, stats: any) {
  currentView = 'scan-results';
  headerBox.show();
  statsBox.hide();
  capabilitiesBox.hide();
  quickStartBox.hide();
  menuBox.hide();
  
  const grade = report.score >= 80 ? 'A' : report.score >= 60 ? 'B' : report.score >= 40 ? 'C' : 'D';
  const gradeColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : report.score >= 40 ? 'orange' : 'red';
  
  // Calculate severity breakdown
  const critical = report.findings?.filter((f: any) => f.severity === 'critical').length || 0;
  const high = report.findings?.filter((f: any) => f.severity === 'high').length || 0;
  const medium = report.findings?.filter((f: any) => f.severity === 'medium').length || 0;
  const low = report.findings?.filter((f: any) => f.severity === 'low').length || 0;
  
  descriptionBox.setContent(
    `{bold}{white-fg}════════════════════════════════════════════════════{/white-fg}\n` +
    `{bold}{white-fg}SCAN RESULTS{/white-fg}\n` +
    `{bold}{white-fg}════════════════════════════════════════════════════{/white-fg}\n\n` +
    `{white-fg}Overall Score: {/white-fg}{${gradeColor}-fg}{bold}${report.score}/100 (${grade}){/${gradeColor}-fg}\n\n` +
    `{white-fg}Severity Breakdown:{/white-fg}\n` +
    `{red-fg}[!] Critical: {/red-fg}{white-fg}${critical}{/white-fg}\n` +
    `{red-fg}[!!] High: {/red-fg}{white-fg}${high}{/white-fg}\n` +
    `{yellow-fg}[*] Medium: {/yellow-fg}{white-fg}${medium}{/white-fg}\n` +
    `{gray-fg}[i] Low: {/gray-fg}{white-fg}${low}{/white-fg}\n\n` +
    `{white-fg}Statistics:{/white-fg}\n` +
    `{cyan-fg}[+] Files Scanned: {/cyan-fg}{white-fg}${stats.filesScanned}{/white-fg}\n` +
    `{cyan-fg}[✓] Verified Findings: {/cyan-fg}{white-fg}${stats.verifiedFindings}{/white-fg}\n` +
    `{cyan-fg}[~] Potential Issues: {/cyan-fg}{white-fg}${stats.totalFindings || 0}{/white-fg}\n\n` +
    `{gray-fg}────────────────────────────────────────────────────{/gray-fg}\n` +
    `{gray-fg}Press B to return to menu | R to view detailed report{/gray-fg}`
  );
  
  descriptionBox.show();
  footerBox.show();
  helpBox.hide();
  isAnimating = false;
  screen.render();
}

// Quit on Ctrl+C
screen.key(['C-c'], () => {
  process.exit(0);
});

// Initial render
screen.render();
