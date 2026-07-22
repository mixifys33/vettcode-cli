# VettCode CLI → Landing Page Integration Guide

## Overview

The VettCode CLI now integrates seamlessly with the VettCode landing page (https://vettcodecli.vercel.app) to provide **shareable, AI-enhanced security reports** that expire after 7 days for security.

## How It Works

### 1. **Scan Your Project**

```bash
vettcode /path/to/project --upload
```

### 2. **Report Gets Uploaded**

The CLI automatically:

- Generates a detailed security report
- Uploads it to the VettCode web platform
- Creates a unique, expirable link (7-day expiration)
- Saves a local copy in `.vettcode-reports/`

### 3. **Share the Link**

You get a shareable URL like:

```
https://vettcodecli.vercel.app/reports/report_1234567890_abc123xyz
```

### 4. **Team Views Report Online**

The web report includes:

- **Interactive Vulnerability Viewer** - Filter by severity, search, expand details
- **Severity Breakdown** - Visual distribution of issues
- **AI Security Assistant** - Chat with AI to understand vulnerabilities and get fixes
- **Expirable Links** - Reports expire after 7 days for security

## Usage Examples

### Quick Scan + Upload

```bash
vettcode . --upload
```

**Result:** Fast scan, uploaded to web, shareable link provided

### Deep Scan + Upload

```bash
vettcode . --mode deep --upload
```

**Result:** Comprehensive scan with AI analysis, uploaded to web

### Save Locally + Upload

```bash
vettcode . -o report.json --upload
```

**Result:** JSON saved locally, HTML uploaded to web

### Static-Only + Upload

```bash
vettcode . --no-ai --upload
```

**Result:** Fast static scan without AI, uploaded to web

## AI Assistant Features

When you upload a report to the web, team members can:

### Ask Security Questions

- "Explain the critical issues"
- "How do I fix SQL injection?"
- "What's the security impact?"
- "Show XSS prevention tips"

### Get Code Examples

The AI provides:

- ✅ **Before/After code examples**
- 🔧 **Step-by-step fix instructions**
- 🛡️ **Prevention best practices**
- 📊 **Risk assessment**

### Example AI Conversation

```
User: "Explain the SQL injection vulnerability"

AI: 🔴 Critical Issue Found

SQL Injection in src/database.js:42

The issue: User input is directly concatenated into SQL query
Risk: Attackers can execute arbitrary SQL commands

Fix:
❌ Vulnerable:
const query = `SELECT * FROM users WHERE id = ${userId}`;

✅ Secure:
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

Impact: This is high priority - address immediately.
```

## Report Expiration

### Why 7 Days?

- **Security:** Reports contain sensitive information about your codebase
- **Privacy:** Automatic expiration prevents indefinite exposure
- **Compliance:** Aligns with security best practices

### What Happens After Expiration?

- Link returns "Report expired or not found"
- Local copy remains in `.vettcode-reports/`
- Can re-scan and upload anew report anytime

### Need Longer Access?

- Download the local HTML report from `.vettcode-reports/`
- Save the JSON output with `-o report.json`
- Re-scan and upload for a fresh 7-day link

## API Configuration

### Default API Endpoint

```
https://vettcodecli.vercel.app/api/reports/upload
```

### Custom API Endpoint (Self-Hosted)

Set environment variable:

```bash
export VETTCODE_API_URL=https://your-domain.com/api/reports/upload
```

Or create `.env` file:

```env
VETTCODE_API_URL=https://your-domain.com/api/reports/upload
```

## File Structure

### Local Reports

```
your-project/
  .vettcode-reports/
    vettcode-report-2024-07-22T10-30-45.html
    vettcode-report-2024-07-21T15-20-30.html
```

### Web Reports

```
https://vettcodecli.vercel.app/reports/report_1234567890_abc123
├── Interactive viewer
├── AI chat assistant
└── Expires in 7 days
```

## Security & Privacy

### What Gets Uploaded

✅ **Uploaded:**

- Finding titles, descriptions, severities
- File names and line numbers (no actual code)
- Mitigation recommendations
- Scan metadata (file count, lines scanned)

❌ **NOT Uploaded:**

- Actual source code
- Environment variables
- API keys or secrets
- Full file contents

### Data Protection

- 🔒 Reports stored securely
- ⏱️ Automatic expiration (7 days)
- 🌐 HTTPS encryption
- 🚫 No tracking or analytics

## Troubleshooting

### Upload Fails

```bash
❌ Upload failed: Failed to upload report
```

**Solutions:**

1. Check internet connection
2. Verify API is accessible: `curl https://vettcodecli.vercel.app/api/reports/upload`
3. Check firewall/proxy settings
4. Report is still saved locally in `.vettcode-reports/`

### Link Not Working

```
Report expired or not found
```

**Reasons:**

- Report expired (>7 days old)
- Invalid report ID
- Report was manually deleted

**Solution:** Re-run scan with `--upload` to get a fresh link

## Workflow Examples

### Daily Development

```bash
# Quick local scan for immediate feedback
vettcode .

# Review local HTML report
# open .vettcode-reports/vettcode-report-*.html
```

### Before Pull Request

```bash
# Deep scan + upload for team review
vettcode . --mode deep --upload

# Share link in PR description
# Team can review + ask AI assistant questions
```

### CI/CD Pipeline

```bash
# Static scan + JSON output (no AI needed)
vettcode . --no-ai -o scan-results.json

# Upload for stakeholder review (optional)
vettcode . --no-ai --upload
```

### Security Audit

```bash
# Comprehensive scan with all findings
vettcode . --mode deep -o audit-results.json --upload

# Local JSON for archival
# Web link for team collaboration + AI assistance
```

## Benefits

### For Developers

- 🚀 **Fast Local Scans** - Immediate feedback in terminal
- 💾 **Local Reports** - Offline access to HTML reports
- 🌐 **Shareable Links** - Easy collaboration with team

### For Teams

- 👥 **Collaborative Review** - Everyone sees the same report
- 🤖 **AI Assistant** - Ask questions, get explanations
- 🔒 **Secure Sharing** - Links expire automatically

### For Security Teams

- 📊 **Comprehensive Data** - Detailed vulnerability information
- ⏱️ **Time-Bound Access** - Automatic 7-day expiration
- 📝 **Audit Trail** - Scan metadata and timestamps

## Next Steps

1. **Try It:** `vettcode . --upload`
2. **Share Link:** Send to team members
3. **Ask AI:** Use the AI assistant on the web report
4. **Iterate:** Fix issues and re-scan

## Support

- 📚 **Documentation:** https://github.com/mixifys33/vettcode-cli
- 🐛 **Issues:** https://github.com/mixifys33/vettcode-cli/issues
- 🌐 **Web Platform:** https://vettcodecli.vercel.app

---

**Powered by VettCode CLI v2.1.0+**
