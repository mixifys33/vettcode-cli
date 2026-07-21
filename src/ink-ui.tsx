#!/usr/bin/env node

/**
 * VettCode CLI - Ink-based Interactive TUI
 * Entry point for the full-screen interactive terminal application
 */

import React from 'react';
import { render } from 'ink';
import { App } from './screens/App';

// Clear screen before rendering
process.stdout.write('\x1Bc');

// Render the app with fullscreen mode
render(<App />, {
  exitOnCtrlC: true,
  patchConsole: false,
});
