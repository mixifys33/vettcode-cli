#!/usr/bin/env node

/**
 * VettCode CLI - Ink-based Interactive TUI
 * Entry point for the full-screen interactive terminal application
 */

import React from 'react';
import { render } from 'ink';
import { App } from './screens/App';

// Render the app
render(<App />);
