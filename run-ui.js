#!/usr/bin/env node

// Set environment variables to configure tsx/esbuild
process.env.TSX_NODE_OPTIONS = JSON.stringify({
  esbuildOptions: {
    external: ['ink', 'ink-select-input', 'ink-text-input', 'react', 'react-dom', 'yoga-layout']
  }
});

// Run tsx with the UI file
const { spawn } = require('child_process');
const path = require('path');

const uiPath = path.join(__dirname, 'src', 'ui', 'index.tsx');

const child = spawn('npx', ['tsx', uiPath], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
