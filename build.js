const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function buildCLI() {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, 'src', 'cli.ts')],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: path.join(__dirname, 'dist', 'cli.js'),
      external: [
        '@babel/parser',
        '@babel/traverse',
        'blessed',
        'chalk'
      ],
      format: 'cjs',
      sourcemap: false,
      treeShaking: true,
      minify: false,
      logLevel: 'info',
    });
    
    console.log('✓ CLI build completed successfully');
  } catch (error) {
    console.error('✗ CLI build failed:', error);
    process.exit(1);
  }
}

async function buildInkUI() {
  try {
    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    await esbuild.build({
      entryPoints: [path.join(__dirname, 'src', 'ink-ui.tsx')],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: path.join(__dirname, 'dist', 'ink-ui.js'),
      external: [
        'ink',
        'react',
        'ink-spinner',
        'chalk'
      ],
      format: 'cjs',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      sourcemap: false,
      treeShaking: true,
      minify: false,
      logLevel: 'info',
    });
    
    console.log('✓ Ink UI build completed successfully');
  } catch (error) {
    console.error('✗ Ink UI build failed:', error);
    process.exit(1);
  }
}

async function buildTUI() {
  try {
    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    await esbuild.build({
      entryPoints: [path.join(__dirname, 'src', 'tui', 'index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: path.join(__dirname, 'dist', 'tui.js'),
      external: [
        'blessed',
        'chalk'
      ],
      format: 'cjs',
      sourcemap: false,
      treeShaking: true,
      minify: false,
      logLevel: 'info',
    });
    
    console.log('✓ TUI build completed successfully');
  } catch (error) {
    console.error('✗ TUI build failed:', error);
    // Don't exit on TUI build failure since it's optional
    console.warn('⚠ TUI build failed but continuing...');
  }
}

async function build() {
  console.log('Building VettCode CLI...\n');
  await buildCLI();
  await buildInkUI();
  await buildTUI();
  console.log('\n✓ All builds completed successfully');
}

build();
