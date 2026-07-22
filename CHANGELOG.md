# VettCode CLI Changelog

## [2.2.0] - 2026-07-22

### 🎉 Major Features

#### Web Report Upload Integration

- **Shareable Reports:** Upload scan reports to VettCode web platform with `--upload` flag
- **AI Assistant:** Web reports include interactive AI chat for security advice
- **Expirable Links:** Reports automatically expire after 7 days for security
- **Dual Storage:** Reports saved both locally (`.vettcode-reports/`) and uploaded to web

### ✨ New Features

- `--upload` flag to upload reports to https://vettcodecli.vercel.app
- Automatic shareable link generation with 7-day expiration
- Interactive web viewer with AI assistant integration
- Comprehensive CLI integration guide (`CLI_INTEGRATION_GUIDE.md`)

### 🔧 Changes

- Reports always saved locally regardless of upload status
- Improved error messages for upload failures
- Better help text explaining upload feature
- Removed old GitHub Pages upload method

### 📚 Documentation

- Added `CLI_INTEGRATION_GUIDE.md` with complete usage examples
- Updated help text with clear upload examples
- Added troubleshooting guide for upload issues

### 🎯 Usage Examples

```bash
# Quick scan + web upload
vettcode . --upload

# Deep scan + web upload
vettcode . --mode deep --upload

# Static scan + web upload (no AI needed)
vettcode . --no-ai --upload
```

### 🌐 Web Report Features

- **Interactive Viewer:** Filter by severity, search findings
- **AI Assistant:** Ask questions about vulnerabilities
- **Code Examples:** Get before/after fix examples
- **Security Advice:** Best practices and prevention tips
- **Expirable Links:** 7-day automatic expiration

---

## [2.1.0] - 2024-07-20

### Features

- Enhanced static analysis with data flow tracking
- Control flow analysis for better vulnerability detection
- Improved false positive reduction
- Terminal UI (TUI) mode with ink
- Better error handling and progress reporting

### Improvements

- Faster scan times with optimized AST extraction
- Better token reduction (70%+ savings)
- More accurate severity scoring
- Enhanced report confidence metrics

---

## [2.0.0] - 2024-07-15

### Major Release

- Complete rewrite with TypeScript
- Multi-layer verification system
- AI-powered analysis with OpenRouter
- Hybrid scanning (Static + AST + AI)
- Detailed HTML report generation
- Report confidence scoring

### Breaking Changes

- New CLI API with different flags
- Changed report format
- Removed legacy scanning modes

---

## [1.1.0] - 2024-07-10

### Features

- Basic static analysis
- Simple HTML reports
- JSON output support

---

## [1.0.0] - 2024-07-05

### Initial Release

- First public release
- Basic security scanning
- Simple CLI interface
