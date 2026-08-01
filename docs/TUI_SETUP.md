# VettCode CLI - Interactive TUI Setup

## Overview

VettCode CLI now includes a **production-grade interactive Terminal User Interface (TUI)** built with **Ink** (React for CLI), providing a modern, full-screen experience similar to Vercel CLI, Prisma CLI, and Raycast.

---

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `ink` - React-based terminal UI framework
- `ink-spinner` - Loading spinners
- `react` - React runtime for Ink
- `chalk` - Terminal colors
- `tsx` - TypeScript execution

### 2. Build the Project

```bash
npm run build
```

This builds:
- `dist/cli.js` - Traditional CLI interface
- `dist/ink-ui.js` - Interactive TUI interface

---

## Usage

### Launch Interactive TUI

Simply run without any arguments:

```bash
vettcode
```

Or explicitly:

```bash
npm run tui
```

### Traditional CLI Mode

Provide a directory argument:

```bash
vettcode <directory>
vettcode ./my-project --mode deep
vettcode ./my-project --no-ai -o report.json
```

---

## Features

### 🎨 Modern UI Design

- **Clean Layout**: No ASCII borders, uses spacing and alignment
- **Color Hierarchy**: Cyan (branding), Yellow (highlights), Green (success), Red (critical)
- **Responsive**: Adapts to terminal size
- **Premium Feel**: Inspired by Vercel CLI, Prisma CLI, Raycast

### ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Start Smart Scan (auto-detect directory) |
| **Shift+S** | Start Manual Scan (select directory) |
| **Q** | Exit application |
| **R** | View Reports history |
| **D** | Change scan directory |
| **F** | Filter results by severity |
| **E** | Export results (JSON/Markdown/PDF) |
| **A** | Toggle AI analysis mode |
| **P** | Pause/Resume scan |
| **C** | Clear current results |
| **B** | Go back to previous screen |
| **H** | Show help/shortcuts guide |
| **Enter** | Select/Confirm menu item |
| **Esc** | Cancel action or return to home |
| **↑↓** | Navigate menu items |
| **←→** | Switch between panels |

### 📱 Screens

1. **Home Screen**
   - Header with branding
   - Stats panel (4 key metrics)
   - Capabilities panel (5 features)
   - Quick start commands
   - Interactive menu
   - Dynamic context panel
   - Footer with credits

2. **Scan Screen**
   - Live progress indicator
   - Phase tracking (Static → AST → AI → Verification)
   - Percentage progress bar
   - Detailed status messages
   - Pause/Resume support

3. **Results Screen**
   - Score display with color coding
   - Findings by severity
   - Critical blockers highlighted
   - Strengths identified
   - Export options

4. **Help Screen**
   - All keyboard shortcuts
   - Command documentation
   - Quick reference guide

---

## Architecture

### Component Structure

```
src/
├── ui/
│   ├── Header.tsx           # Branding + title
│   ├── StatsPanel.tsx       # 4 key metrics
│   ├── Capabilities.tsx     # Feature list
│   ├── QuickStart.tsx       # Command examples
│   ├── Menu.tsx             # Interactive menu
│   ├── ContextPanel.tsx     # Dynamic descriptions
│   └── Footer.tsx           # Credits + shortcuts
├── screens/
│   ├── Home.tsx             # Main dashboard
│   ├── Scan.tsx             # Scanning progress
│   ├── Results.tsx          # Scan results
│   ├── Help.tsx             # Keyboard shortcuts
│   └── App.tsx              # Root component (state + routing)
└── ink-ui.tsx               # Entry point
```

### State Management

Uses React hooks:
- `useState` - Component state
- `useInput` - Keyboard input handling
- `useApp` - Application lifecycle (exit)

### Navigation Logic

```typescript
type Screen = 'home' | 'scan' | 'results' | 'help' | 'exit';
```

Keyboard shortcuts trigger screen transitions:
- `S` → Start scan → `scan` screen
- `Enter` on menu → Navigate to selected screen
- `B` / `Esc` → Return to `home` screen
- `Q` → Exit application

---

## Development

### Run in Development Mode

```bash
npm run tui
```

This runs the TypeScript source directly using `tsx`.

### Build for Production

```bash
npm run build
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `npm run tui` | Launch TUI in dev mode |
| `npm run build` | Build CLI + Ink UI |
| `npm run dev` | Build and run CLI |
| `npm start` | Run built CLI |

---

## Design System

### Color Palette

```typescript
Cyan/Blue   → Branding, titles, highlights
Yellow      → Warnings, important info
Green       → Success, positive indicators
Red         → Critical issues, errors
Gray        → Secondary text, subtle info
White       → Primary text
```

### Layout Principles

- **No ASCII borders** (`===`, `---`, `│`)
- **Spacing-based separation**
- **Flexbox layout** (`direction=row/column`)
- **Alignment over decoration**
- **Visual hierarchy through color**

### Typography

- **Bold** → Titles, headings, important labels
- **Color** → Category/severity indicators
- **Dim/Gray** → Secondary information
- **Icons** → Visual anchors (🛡️, 🔍, ⚡, etc.)

---

## Troubleshooting

### TUI Not Launching

If `vettcode` doesn't launch the TUI:

1. **Rebuild the project:**
   ```bash
   npm run build
   ```

2. **Check if `dist/ink-ui.js` exists:**
   ```bash
   ls dist/
   ```

3. **Run TUI directly:**
   ```bash
   npm run tui
   ```

### Build Errors

If you encounter build errors:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Keyboard Shortcuts Not Working

Ensure your terminal supports:
- Arrow keys
- Shift modifiers
- Enter/Escape keys

Tested terminals:
- Windows Terminal ✅
- PowerShell ✅
- CMD ✅
- Git Bash ✅
- WSL ✅

---

## Technology Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `ink` | ^3.2.0 | React-based TUI framework |
| `react` | ^17.0.2 | React runtime |
| `ink-spinner` | ^4.0.3 | Loading indicators |
| `chalk` | ^4.1.2 | Terminal colors |
| `commander` | ^11.1.0 | CLI argument parsing |
| `tsx` | ^4.7.0 | TypeScript execution |
| `esbuild` | ^0.28.1 | Build tooling |

---

## Credits

**Powered by AD-Technologies and AI Enterprises**

Special thanks to:
- **Masereka Adorable**
- **Hacker X**

---

## Next Steps

- [ ] Implement real scan integration (connect to `cli-scan-orchestrator.ts`)
- [ ] Add settings screen
- [ ] Add report history persistence
- [ ] Add directory picker UI
- [ ] Add export functionality (JSON/Markdown/PDF)
- [ ] Add result filtering by severity
- [ ] Add scan pause/resume logic
- [ ] Add configuration editor for AI settings

---

## License

MIT
