# VettCode CLI - Interactive TUI Installation Guide

## 🚀 Quick Start

```bash
# 1. Navigate to project directory
cd C:\Users\USER\Desktop\ALLOUTGADGATS\Vettcode-engine-cli

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Launch interactive TUI
vettcode
```

---

## 📦 What Gets Installed

### Production Dependencies
```json
{
  "ink": "^3.2.0",              // React-based TUI framework
  "ink-spinner": "^4.0.3",      // Loading animations
  "react": "^17.0.2",           // React runtime for Ink
  "chalk": "^4.1.2",            // Terminal colors
  "commander": "^11.1.0",       // CLI argument parsing
  "@babel/parser": "^7.26.3",   // AST parsing
  "@babel/traverse": "^7.26.5", // AST traversal
  "dotenv": "^16.4.0",          // Environment variables
  "ora": "^5.4.1",              // Spinners for CLI mode
  "cli-table3": "^0.6.3",       // Tables for CLI mode
  "blessed": "^0.1.81"          // Alternative TUI framework (legacy)
}
```

### Development Dependencies
```json
{
  "typescript": "^5.7.0",
  "esbuild": "^0.28.1",
  "tsx": "^4.7.0",
  "@types/node": "^22.10.0",
  "@types/react": "^17.0.2",
  "@types/babel__traverse": "^7.20.6"
}
```

---

## 🏗️ Project Structure

After installation, your structure will be:

```
Vettcode-engine-cli/
├── src/
│   ├── ui/                    # Ink UI Components
│   │   ├── Header.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── Capabilities.tsx
│   │   ├── QuickStart.tsx
│   │   ├── Menu.tsx
│   │   ├── ContextPanel.tsx
│   │   └── Footer.tsx
│   ├── screens/               # Screen Components
│   │   ├── Home.tsx
│   │   ├── Scan.tsx
│   │   ├── Results.tsx
│   │   ├── Help.tsx
│   │   └── App.tsx
│   ├── ink-ui.tsx            # Ink TUI Entry Point
│   ├── cli.ts                # Traditional CLI Entry Point
│   ├── cli-scan-orchestrator.ts
│   ├── openrouter.ts
│   └── ... (other source files)
├── dist/                      # Built files (after npm run build)
│   ├── cli.js
│   └── ink-ui.js
├── package.json
├── build.js
├── tsconfig.json
├── README.md
├── TUI_SETUP.md
└── INSTALLATION.md (this file)
```

---

## 🔧 Build Process

The build script (`build.js`) creates two bundles:

### 1. **CLI Bundle** (`dist/cli.js`)
- Traditional command-line interface
- Used when you run: `vettcode <directory>`
- Outputs results to terminal as text/tables

### 2. **Ink UI Bundle** (`dist/ink-ui.js`)
- Interactive full-screen TUI
- Used when you run: `vettcode` (no arguments)
- React-based interactive dashboard

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```env
# OpenRouter API Keys (for AI analysis)
OPENROUTER_API_KEY_1=sk-or-v1-your-first-key
OPENROUTER_API_KEY_2=sk-or-v1-your-second-key
OPENROUTER_API_KEY_3=sk-or-v1-your-third-key

# AI Models (comma-separated)
OPENROUTER_MODELS=openrouter/free,deepseek/deepseek-chat-v3-0324:free

# Optional: Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Get free API keys at: https://openrouter.ai/

---

## 📱 Usage Modes

### Mode 1: Interactive TUI (Recommended)

```bash
vettcode
```

Features:
- ✅ Full-screen interactive dashboard
- ✅ Keyboard navigation
- ✅ Real-time progress
- ✅ Menu system
- ✅ Help screen
- ✅ Modern UI design

### Mode 2: Traditional CLI

```bash
# Quick scan
vettcode ./my-project

# Deep scan with AI
vettcode ./my-project --mode deep

# Without AI (static only)
vettcode ./my-project --no-ai

# Save to JSON
vettcode ./my-project -o report.json

# Custom ignore patterns
vettcode ./my-project -i "node_modules,dist,build"

# Show help
vettcode --help

# Show version
vettcode --version
```

---

## 🎯 Verification Steps

After installation, verify everything works:

### 1. Check Installation
```bash
npm list ink
npm list react
npm list ink-spinner
```

### 2. Test Build
```bash
npm run build
# Should see: ✓ CLI build completed successfully
#             ✓ Ink UI build completed successfully
```

### 3. Test TUI Launch
```bash
npm run tui
# Should launch interactive dashboard
```

### 4. Test Traditional CLI
```bash
node dist/cli.js --help
# Should show help menu
```

---

## 🐛 Troubleshooting

### Issue: "ink" module not found

**Solution:**
```bash
npm install ink react ink-spinner --save
npm run build
```

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Install @types packages
npm install --save-dev @types/react @types/node

# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### Issue: TUI doesn't launch

**Solution:**
```bash
# Check if ink-ui.js was built
ls dist/

# If missing, rebuild
npm run build

# Try running directly
npm run tui
```

### Issue: Keyboard shortcuts don't work

**Cause:** Some terminals don't support all key events

**Solution:** Use a modern terminal:
- Windows Terminal (Recommended)
- PowerShell
- Git Bash

---

## 🚀 Advanced

### Global Installation

```bash
# Link locally
npm link

# Now run from anywhere
vettcode
```

### Publish to npm

```bash
# Update version in package.json
npm version patch  # or minor, major

# Build
npm run build

# Publish
npm publish
```

---

## 📚 Documentation

- **Full TUI Guide:** See `TUI_SETUP.md`
- **Main README:** See `README.md`
- **API Keys:** https://openrouter.ai/
- **GitHub:** https://github.com/mixifys33/vettcode-cli

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Project builds successfully (`npm run build`)
- [ ] `dist/cli.js` exists
- [ ] `dist/ink-ui.js` exists
- [ ] TUI launches (`npm run tui`)
- [ ] Traditional CLI works (`node dist/cli.js --help`)
- [ ] API keys configured (`.env`)

---

## 💡 Next Steps

1. **Try the Interactive TUI:**
   ```bash
   vettcode
   ```

2. **Run a Test Scan:**
   - Press `S` to start scan
   - Navigate with arrow keys
   - Press `H` for help

3. **Configure AI (Optional):**
   - Press `A` to toggle AI mode
   - Set API keys in `.env`

4. **Explore Features:**
   - View reports history (`R`)
   - Check settings
   - Export results (`E`)

---

## 🎉 You're All Set!

VettCode CLI with Interactive TUI is now installed and ready to use.

Launch it with: `vettcode`

Enjoy the modern, interactive code security scanning experience! 🛡️
