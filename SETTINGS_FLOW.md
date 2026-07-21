# Settings Screen - User Flow & Visual Guide

## Navigation Flow

```
┌─────────────┐
│ Home Screen │
│ Mode: QUICK │
│ AI: ENABLED │
└──────┬──────┘
       │
       ├── Press [S] ──────────────────────┐
       │                                   │
       ├── Navigate Menu ──────┐           │
       │   Select "View Settings"          │
       │   Press [Enter]        │           │
       │                        ▼           ▼
       │               ┌──────────────────────┐
       │               │  Settings Screen     │
       │               │  ┌─────────────────┐ │
       │               │  │ > Scan Mode     │ │
       │               │  │   AI Analysis   │ │
       │               │  │   Directory     │ │
       │               │  │   Start Scan    │ │
       │               │  └─────────────────┘ │
       │               └──────────┬───────────┘
       │                          │
       │  ┌───────────────────────┼───────────────────┐
       │  │ [↑↓] Navigate         │ [Enter] Toggle    │
       │  │ [B] Back              │ [Q] Quit          │
       │  └───────────────────────┴───────────────────┘
       │                          │
       │                          │ Select "Start Scan"
       │                          │ Press [Enter]
       │                          ▼
       │               ┌──────────────────────┐
       │               │   Scan Screen        │
       │               │   AI Analysis: ON    │
       │               │   ⠋ AI review (75%)  │
       │               └──────────┬───────────┘
       │                          │
       │                          │ Scan Complete
       │                          ▼
       │               ┌──────────────────────┐
       │               │  Results Screen      │
       │               │  Score: 75/100       │
       │               └──────────┬───────────┘
       │                          │
       │                          │ Press [B]
       └──────────────────────────┴───────────┐
                                              │
                                              ▼
                                    ┌─────────────┐
                                    │ Home Screen │
                                    │ (Updated)   │
                                    └─────────────┘
```

## Screen Mockups

### Home Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ VettCode [CLI]                                                  │
│ Enterprise-Grade Code Security Scanner                         │
│                                                                 │
│ Mode: QUICK    AI Analysis: ENABLED                            │
│                                                                 │
│ [V] 350+ Security Patterns    [>] AI-Powered Analysis          │
│ [>] <3% False Positives       [>] Multi-Layer Verification     │
│                                                                 │
│ ┌─────────────────┬─────────────────────────────────────────┐  │
│ │ CAPABILITIES    │ QUICK START                             │  │
│ │                 │ vettcode <directory>                    │  │
│ │ [V] Detection   │ vettcode --mode deep                    │  │
│ │ [>] Quality     │                                         │  │
│ │ [>] Database    │ MENU                                    │  │
│ │ [>] Analysis    │ > Start Scan                [S]         │  │
│ │ [>] Reporting   │   View Settings                         │  │
│ │                 │   Configure AI              [A]         │  │
│ │                 │   View Reports              [R]         │  │
│ │                 │   Documentation             [H]         │  │
│ │                 │   Exit                      [Q]         │  │
│ │                 │                                         │  │
│ │                 │ CONTEXT                                 │  │
│ │                 │ Run a deep security and quality         │  │
│ │                 │ analysis on your project directory.     │  │
│ └─────────────────┴─────────────────────────────────────────┘  │
│                                                                 │
│                      Powered by AD-Technologies and AI Enterprises│
└─────────────────────────────────────────────────────────────────┘
```

### Settings Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ VettCode [CLI]                                                  │
│ Enterprise-Grade Code Security Scanner                         │
│                                                                 │
│ [>] SCAN CONFIGURATION                                          │
│                                                                 │
│ Configure your scan settings before starting. Use arrow keys   │
│ to navigate and Enter to change.                               │
│                                                                 │
│   Scan Mode:         Quick Scan                                │
│ > AI Analysis:       Enabled                                   │
│   Target Directory:  C:\Users\USER\Desktop\...\project         │
│   Start Scan:        → Begin scanning with current settings    │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ [>] Configuration Help                                    │  │
│ │                                                           │  │
│ │ AI Analysis:                                              │  │
│ │   • Enabled: Uses AI for deeper analysis                 │  │
│ │   • Disabled: Static analysis only (faster)              │  │
│ │                                                           │  │
│ │ Press [Enter] to toggle AI on/off                        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Press [↑↓] to navigate • [Enter] to select/toggle •            │
│ [B] to go back • [Q] to quit                                   │
│                                                                 │
│                      Powered by AD-Technologies and AI Enterprises│
└─────────────────────────────────────────────────────────────────┘
```

### Scan Screen (AI Enabled)

```
┌─────────────────────────────────────────────────────────────────┐
│ VettCode [CLI]                                                  │
│ Enterprise-Grade Code Security Scanner                         │
│                                                                 │
│ [?] SCANNING IN PROGRESS                                        │
│                                                                 │
│ Directory: C:\Users\USER\Desktop\ALLOUTGADGATS\project         │
│ Mode: Quick Scan                                                │
│ AI Analysis: Enabled                                            │
│                                                                 │
│ ⠋ AI review (75%)                                              │
│ [████████████████░░░░]                                          │
│   Analyzing extracted code…                                     │
│                                                                 │
│ Press [P] to pause • [B] to go back • [Esc] to cancel         │
│                                                                 │
│                      Powered by AD-Technologies and AI Enterprises│
└─────────────────────────────────────────────────────────────────┘
```

### Scan Screen (AI Disabled)

```
┌─────────────────────────────────────────────────────────────────┐
│ VettCode [CLI]                                                  │
│ Enterprise-Grade Code Security Scanner                         │
│                                                                 │
│ [?] SCANNING IN PROGRESS                                        │
│                                                                 │
│ Directory: C:\Users\USER\Desktop\ALLOUTGADGATS\project         │
│ Mode: Quick Scan                                                │
│ AI Analysis: Disabled                                           │
│                                                                 │
│ ⠋ Enhanced analysis (85%)                                      │
│ [█████████████████░░]                                           │
│   Deep static analysis…                                         │
│                                                                 │
│ Press [P] to pause • [B] to go back • [Esc] to cancel         │
│                                                                 │
│                      Powered by AD-Technologies and AI Enterprises│
└─────────────────────────────────────────────────────────────────┘
```

## Interaction Examples

### Example 1: Quick Scan with AI

```
1. Run: vettcode
2. Home screen appears with "Mode: QUICK  AI Analysis: ENABLED"
3. Press [S] - Auto-starts scan with current settings
4. Scan shows: "AI review (75%)"
5. Results displayed
```

### Example 2: Change to Deep Scan, Disable AI

```
1. Run: vettcode
2. Navigate to "View Settings" → Press [Enter]
3. Settings screen appears
4. Press [Enter] on "Scan Mode" → Toggles to "Deep Scan"
5. Press [↓] to navigate to "AI Analysis"
6. Press [Enter] → Toggles to "Disabled"
7. Press [↓↓] to "Start Scan"
8. Press [Enter] - Scan starts with Deep mode, AI disabled
9. Scan shows: "Enhanced analysis (85%)" instead of "AI review"
```

### Example 3: Toggle AI from Home

```
1. Run: vettcode
2. Home shows "AI Analysis: ENABLED"
3. Press [A] - Instantly toggles AI
4. Home now shows "AI Analysis: DISABLED"
5. Press [S] - Scan starts with AI disabled
```

## Keyboard Shortcut Quick Reference

| Key       | Action                       | Available On    |
| --------- | ---------------------------- | --------------- |
| `S`       | Start Smart Scan             | Home            |
| `Shift+S` | Start Manual Scan (Settings) | Home            |
| `A`       | Toggle AI                    | Home            |
| `D`       | Change Directory (Settings)  | Home            |
| `R`       | View Reports                 | Home            |
| `H`       | Show Help                    | All screens     |
| `Q`       | Quit                         | All screens     |
| `B`       | Go Back                      | All except Home |
| `Esc`     | Cancel/Back                  | All screens     |
| `↑↓`      | Navigate                     | Home, Settings  |
| `Enter`   | Select/Toggle                | Home, Settings  |
| `P`       | Pause/Resume                 | Scan screen     |

## State Changes

### Toggle Scan Mode

```
Quick Scan ←→ Deep Scan
(Press Enter on "Scan Mode" option)
```

### Toggle AI Analysis

```
Enabled ←→ Disabled
(Press Enter on "AI Analysis" or Press [A] on Home)
```

### Scan Phases (AI Enabled)

```
1. Static analysis (25%)
2. Code extraction (45%)
3. AI review (75%)         ← AI-specific phase
4. Verification (85%)
5. Complete (100%)
```

### Scan Phases (AI Disabled)

```
1. Static analysis (30%)
2. Code extraction (60%)
3. Enhanced analysis (85%)  ← Replaces AI phase
4. Complete (100%)
```

## Color Coding

- **Cyan/Blue**: Branding, headers, highlights
- **Green**: Success, enabled states, positive actions
- **Red**: Critical, disabled states
- **Yellow**: Warnings, mode indicators
- **Gray**: Subtle text, help text
- **White**: Standard text

## Tips for Users

1. **Quick Test**: Press `S` from home for immediate scan
2. **Configure First**: Use `Shift+S` or navigate to Settings to customize
3. **Toggle AI Fast**: Press `A` on home screen to quickly enable/disable AI
4. **Real-time Feedback**: Status bar on home shows current configuration
5. **Context Help**: Settings screen shows detailed help for each option
6. **Visual Feedback**: Scan progress clearly shows which analysis mode is active

---

**Implementation Complete** ✓ Version 1.1.5
