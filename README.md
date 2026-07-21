# VettCode

**Stop Shipping Broken Code. Scan What Actually Fails in Production.**

---

## ⚡ What is VettCode?

**VettCode is a production-grade code scanner built to catch what linters, tests, and reviews miss.**

It detects:

* 🔐 **Real security vulnerabilities**
* ⚙️ **Production-breaking logic flaws**
* 🧠 **Hidden risks inside “working” code**

> If your code passes tests but fails in production —
> **VettCode is what you were missing.**

---

## 🚀 Start Here (No Setup Required)

👉 https://vetted-xi.vercel.app/

Run a full scan in minutes — directly in your browser.

---

## 🔎 Web Scanner (Instant Analysis)

The fastest way to understand your codebase risk.

### ⚡ What You Get

* **0–100 strict production score**
* **Verified findings (<3% false positives)**
* **Static + AI hybrid analysis**
* **Actionable fixes — not just warnings**

---

### 🔐 Built for Privacy

* No code is stored
* No uploads persist
* Repo scans use temporary snapshots
* Everything resets after your session

> Your code never leaves your control.

---

### ⚡ Scan Modes

**Quick Scan (Recommended)**

* Targets high-risk areas:

  * Auth
  * Routes
  * Config
* ⏱️ ~1–4 minutes
* Perfect for first-pass validation

**Deep Scan (Release Mode)**

* Full-system analysis
* Parallel AI processing
* Detects deeper architectural risks
* Built for production readiness checks

---

### 📦 Scan Your Code

* Paste a GitHub / GitLab / Bitbucket URL
* Upload a folder or ZIP
* Dependencies & build files auto-excluded

---

## 💻 VettCode CLI (For Real Workflows)

For developers who want **speed, automation, and full control**.

Run scans directly inside your terminal.

---

### 📦 Install

```bash
npm install -g vettcode-cli
```

---

### ▶️ Run a Scan

```bash
vettcode .
```

---

### ⚡ Advanced Usage

vettcode  => this is to open up the main menu

```bash
vettcode . --mode deep
vettcode . --json
vettcode . -o report.json
vettcode . --no-ai
```

---

## 🧠 How VettCode Works

Unlike basic scanners, VettCode uses a **multi-layered analysis engine**:

```
Static Analysis → 350+ vulnerability patterns  
AST Extraction → Context-aware slicing  
AI Analysis → Deep semantic reasoning  
Verification Layer → Eliminates false positives  
Report Engine → Score + actionable fixes
```

---

## 🔐 What It Detects

### Security Vulnerabilities

* SQL Injection
* XSS
* Command Injection
* Path Traversal
* Hardcoded secrets
* Auth bypass risks
* Weak cryptography

### Production Failures

* Unhandled errors
* Missing validation
* Race conditions
* Null/undefined crashes

### Code Quality Risks

* Deep complexity
* Dead code
* React anti-patterns

### Database Issues

* N+1 queries
* Missing limits
* No timeouts

---

## 📊 Example Output

```
Score: 72/100 (C-)

Critical:
- SQL Injection in src/api/users.ts:42

Summary:
1 Critical | 3 High | 5 Medium | 3 Low

Verdict:
MODERATE risk — fix before production
```

---

## 🧠 AI (Optional, Powerful)

* Deep reasoning beyond static rules
* Only minimal code snippets are analyzed
* Fully optional — works without AI (~85% capability)

---

## 🛒 VettCode Marketplace

👉 https://vettcode.vercel.app/

**Ship faster using verified production-ready codebases.**

---

### 🔥 What It Is

A marketplace where developers:

* Buy real, production-grade systems
* Sell their code and earn
* Skip months of rebuilding

---

### 💡 Why It Exists

Most developers:

* Build great systems
* Never monetize them

VettCode fixes that.

---

### 🧱 What You Get

* Real startup-grade architectures
* Clean, scalable code
* Full documentation
* Instant downloads

> Not tutorials. Not boilerplates.
> **Real systems you can deploy.**

---

## 🏆 Why Developers Choose VettCode

### ✅ It Finds What Others Miss

Not just syntax issues — **real production risks**

### ⚡ It’s Fast

Scan entire projects in minutes

### 🔐 It’s Private

No storage. No tracking. No risk

### 🧠 It’s Accurate

<3% false positives with verification layer

### 🚀 It Saves Time

Fix issues before they cost you users

---

## 🎯 Mission

Make production-quality software the default — not the exception.

---

## 🌍 Vision

Build the most trusted platform for:

* Code verification
* Developer tooling
* Production-ready applications

---

## ⚠️ Disclaimer

VettCode enhances your workflow — it does not replace:

* Security audits
* Penetration testing
* Manual reviews

---

## 🤝 Contributing

We welcome contributions:

* Detection improvements
* New language support
* Performance optimizations

---

## 📄 License

MIT

---

## 💡 Final Take

> VettCode is not another dev tool.

It’s the difference between:

* Code that works
* And code that survives production
