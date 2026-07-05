# VettCode CLI

**Terminal-based version of VettCode** - AI-powered codebase security and quality scanner.

Scan your codebase directly from your terminal, PowerShell, or command prompt. No web interface required.

## 🎯 What It Does

VettCode CLI provides the **exact same capabilities as the web version**, featuring a hybrid analysis pipeline:

### Analysis Pipeline
1. **Static Analysis** - Pattern-based detection of 350+ vulnerability patterns
2. **AST Extraction** - Intelligent code section extraction to reduce token usage
3. **AI Analysis** - Deep code analysis using OpenRouter AI models (optional)
4. **Verification Layer** - Cross-validation to reduce false positives to <3%
5. **Report Generation** - Comprehensive scoring and actionable recommendations

### Security Vulnerabilities
- SQL Injection (template literals, string concatenation, WHERE/LIMIT clauses)
- XSS (innerHTML, outerHTML, document.write, dangerouslySetInnerHTML)
- Command Injection (exec, spawn, eval, Function constructor)
- Path Traversal (file operations with user input)
- Hardcoded Secrets (API keys, passwords, tokens)
- Authentication Bypass (missing middleware, weak JWT secrets)
- Cryptography Issues (weak algorithms, hardcoded IVs, ECB mode)

### Production Issues
- Unhandled Errors (empty catch blocks, missing error logging)
- Missing Validation (API endpoints without input validation)
- Race Conditions (concurrent database writes)
- Missing Null Checks (property access without validation)

### Code Quality
- Magic Numbers (unexplained numeric constants)
- Deep Nesting (complex control flow)
- Commented Code (dead code left in source)
- React Issues (missing keys, useEffect deps, state mutation)

### Database Issues
- N+1 Query Problems (queries inside loops)
- Missing Connection Limits (unbounded connection pools)
- Missing Timeouts (infinite wait scenarios)

### Advanced Analysis
- **Data Flow Analysis** - Tracks user input from sources to dangerous sinks
- **Control Flow Analysis** - Identifies error handling and validation gaps
- **Reference Graph** - Cross-file dependency mapping for context-aware validation

## 🚀 Installation

### Local Installation

```bash
# Clone the repository
cd Vettcode-engine-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run directly
node dist/cli.js <directory>
```

### Global Installation (Recommended)

```bash
# Install globally
npm install -g .

# Now you can use vettcode from anywhere
vettcode <directory>
```

## 📖 Usage

### Basic Scan

Scan a directory:

```bash
vettcode ./my-project
```

### Advanced Options

```bash
# Save report to JSON file
vettcode ./my-project -o report.json

# Ignore specific patterns (comma-separated)
vettcode ./my-project -i "node_modules,dist,build,test"

# Output JSON format to stdout
vettcode ./my-project --json

# Deep scan mode (analyzes all files instead of priority files)
vettcode ./my-project --mode deep

# Disable AI analysis (static analysis only)
vettcode ./my-project --no-ai

# Combine options
vettcode ./my-project -o report.json -i "node_modules,dist" --mode deep
```

### Options

- `<directory>` - Directory to scan (required)
- `-o, --output <file>` - Save report to JSON file
- `-i, --ignore <patterns>` - Comma-separated ignore patterns
- `--json` - Output JSON format instead of formatted text
- `--mode <mode>` - Scan mode: `quick` (default) or `deep`
- `--no-ai` - Disable AI analysis, use static analysis only
- `-h, --help` - Show help
- `-V, --version` - Show version number

## 🔑 AI Configuration (Optional)

VettCode CLI can use AI for deeper code analysis via OpenRouter. This is optional - the scanner works with static analysis alone.

### Setting Up OpenRouter

1. Get API keys from [OpenRouter.ai](https://openrouter.ai/keys)
2. Create a `.env` file in the CLI directory (or set environment variables)
3. Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
# Edit .env and add your API key
```

### Environment Variables

```bash
# Single API key
OPENROUTER_API_KEY_1=your-api-key-here

# Multiple API keys (for load balancing)
OPENROUTER_API_KEY_1=your-first-api-key
OPENROUTER_API_KEY_2=your-second-api-key
OPENROUTER_API_KEY_3=your-third-api-key

# Or comma-separated
OPENROUTER_API_KEYS=key1,key2,key3

# Optional: Specify AI models (defaults to free models)
OPENROUTER_MODELS=openrouter/free,deepseek/deepseek-chat-v3-0324:free
```

### AI Fallback

If AI analysis fails or no API keys are configured, VettCode CLI automatically falls back to **enhanced static analysis** with 85% coverage of the web version's capabilities.

## 📊 Output

The CLI provides a color-coded terminal output with:

- **Overall Score** (0-100) with letter grade (A+ to F)
- **Executive Verdict** - High-level assessment
- **Findings by Severity** - Count of critical, high, medium, low, info issues
- **Critical Blockers** - Must-fix issues before production
- **Strengths** - What your codebase does well
- **Detailed Findings Table** - Top 20 findings with file locations
- **Scan Metadata** - Files scanned, lines scanned, static/AI findings, tokens saved, report confidence

### Example Output

```
══════════════════════════════════════════════════════════════════
                      SCAN RESULTS
══════════════════════════════════════════════════════════════════

Score: 72/100 (C-)

Analyzed 45 files (3,421 lines). Found 12 issues.

📋 Executive Verdict:
MODERATE: This codebase has some security and quality concerns that should be addressed.

🔍 Findings by Severity:
  1 Critical
  3 High
  5 Medium
  3 Low
  0 Info

🚨 Critical Blockers:
  • SQL Injection via Template Literal in src/api/users.ts:42

✅ Strengths:
  • No obvious security vulnerabilities detected
  • Good error handling practices

📝 Detailed Findings:
┌──────────┬─────────────┬──────────────────────────────┬─────────────────┬──────┐
│ Severity │ Category    │ Title                         │ File             │ Line │
├──────────┼─────────────┼──────────────────────────────┼─────────────────┼──────┤
│ CRITICAL │ security    │ SQL Injection via Template    │ src/api/users.ts │ 42   │
│ HIGH     │ security    │ XSS via dangerouslySetInner   │ src/ui/App.tsx   │ 15   │
│ HIGH     │ production  │ Empty Catch Block             │ src/utils.ts     │ 89   │
...
```

## 🔧 Supported Languages

- **JavaScript/TypeScript** (.js, .jsx, .ts, .tsx)
- **Python** (.py, .pyw)
- **Java** (.java)
- **PHP** (.php, .phtml)
- **Go** (.go)
- **Ruby** (.rb)
- **C#** (.cs)
- **C/C++** (.c, .cpp, .h)
- **Swift** (.swift)
- **Kotlin** (.kt, .kts)
- **Rust** (.rs)
- **Vue** (.vue)
- **Svelte** (.svelte)

## 🚫 Default Ignore Patterns

The following directories and files are ignored by default:

- `node_modules`
- `.git`
- `dist`, `build`
- `.next`
- `coverage`
- `.vscode`, `.idea`
- `*.log`
- `*.min.js`, `*.min.css`
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

You can add more patterns using the `-i` option.

## 📦 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run linter
npm run lint
```

## 🔒 Security & Privacy

- **Local Analysis** - Files are analyzed locally on your machine
- **No Data Persistence** - Scans are stateless, no data is stored
- **AI Optional** - Full static analysis works without AI
- **AI Privacy** - When AI is used, only extracted code sections are sent to OpenRouter (not full files)
- **Token Efficiency** - AST extraction reduces token usage by 60-80%
- **Rate Limiting** - Built-in API key rotation and rate limit handling

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Add more language-specific patterns
- Improve AST extraction for other languages
- Add more verification rules
- Enhance output formatting

## ⚠️ Disclaimer

VettCode CLI is a tool to assist in code review, not a replacement for:

- Professional security audits
- Penetration testing
- Manual code review
- Automated testing

Always validate findings and conduct thorough testing before production deployment.
