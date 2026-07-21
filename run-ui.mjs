#!/usr/bin/env node

import { render } from 'ink';
import React from 'react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Dynamic import to handle ESM/CJS interop
async function runUI() {
  try {
    // Use tsx to transpile and run the TypeScript file
    const { spawn } = await import('child_process');
    const path = await import('path');
    
    const uiPath = path.join(process.cwd(), 'src', 'ui', 'index.tsx');
    
    const child = spawn('npx', ['tsx', uiPath], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-loader=tsx'
      }
    });
    
    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (error) {
    console.error('Failed to launch UI:', error);
    process.exit(1);
  }
}

runUI();
