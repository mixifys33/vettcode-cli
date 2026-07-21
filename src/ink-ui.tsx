#!/usr/bin/env node

/**
 * VettCode CLI - Ink-based Interactive TUI
 * Entry point for the full-screen interactive terminal application
 */

import React from 'react';
import { render } from 'ink';
import { App } from './screens/App';

// Enable alternate screen buffer (prevents stacking)
process.stdout.write('\x1b[?1049h'); // Enable alternate screen
process.stdout.write('\x1b[2J');      // Clear screen
process.stdout.write('\x1b[H');       // Move cursor to home

// Render the app with fullscreen mode
const { waitUntilExit, clear } = render(<App />, {
  exitOnCtrlC: true,
  patchConsole: false,
});

// Cleanup on exit
waitUntilExit().then(() => {
  // Disable alternate screen buffer and restore terminal
  process.stdout.write('\x1b[?1049l'); // Disable alternate screen
});
