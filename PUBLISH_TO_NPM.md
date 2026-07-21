# Publishing VettCode CLI to npm

## 📦 Current Status

- **Current Version:** 1.0.8
- **Package Name:** vettcode-cli
- **npm Registry:** https://www.npmjs.com/package/vettcode-cli

---

## 🚀 Publishing Steps

### Step 1: Update Version Number

Choose the version bump type:

- **Patch** (1.0.8 → 1.0.9) - Bug fixes, minor improvements
- **Minor** (1.0.8 → 1.1.0) - New features (backward compatible)
- **Major** (1.0.8 → 2.0.0) - Breaking changes

For this update (adding Interactive TUI), I recommend **Minor** version bump:

```powershell
npm version minor
```

This will update to **1.1.0** and create a git commit + tag.

Or manually update `package.json`:

```json
{
  "version": "1.1.0"
}
```

---

### Step 2: Update README (Optional)

Update the README to highlight the new TUI feature:

```bash
# Add to README.md
## New in v1.1.0
- 🎨 **Interactive TUI** - Full-screen React-based interface
- ⌨️ **Keyboard Shortcuts** - Navigate with S, R, H, Q, etc.
- 📊 **Real-time Progress** - Live scanning updates
- 🎯 **Modern Design** - Inspired by Vercel/Prisma CLI
```

---

### Step 3: Ensure Files are Included

Update the `files` field in `package.json` to include necessary files:

```json
{
  "files": [
    "dist",
    "src/ui",
    "src/screens",
    "README.md",
    "TUI_SETUP.md",
    "INSTALLATION.md",
    ".env.example",
    "LICENSE"
  ]
}
```

---

### Step 4: Build for Production

```powershell
npm run build
```

Expected output:

```
✓ CLI build completed successfully
✓ Ink UI build completed successfully
✓ TUI build completed successfully
```

---

### Step 5: Test Locally (Important!)

Test the package before publishing:

```powershell
# Test CLI mode
node dist/cli.js --help
node dist/cli.js . --no-ai

# Test TUI mode (launches interactive dashboard)
node dist/ink-ui.js

# Or if you have it linked globally
vettcode
```

---

### Step 6: Git Commit & Push

```powershell
git add .
git commit -m "feat: Add interactive TUI with Ink React framework

- Add full-screen interactive dashboard
- Add keyboard shortcuts (S, R, H, Q, etc.)
- Add Home, Scan, Results, Help screens
- Add real-time progress tracking
- Update to v1.1.0"

git push origin main
git push --tags
```

---

### Step 7: Login to npm (if not already)

```powershell
npm login
```

You'll be prompted for:

- Username
- Password
- Email
- 2FA code (if enabled)

---

### Step 8: Publish to npm

```powershell
npm publish
```

Or if you want to do a dry run first:

```powershell
npm publish --dry-run
```

This shows what will be published without actually publishing.

---

## ✅ Verification After Publishing

### 1. Check npm Registry

```powershell
npm view vettcode-cli
```

Should show version 1.1.0 with updated dependencies.

### 2. Test Installation

```powershell
# In a different directory
npm install -g vettcode-cli@latest

# Test it
vettcode --version
vettcode
```

### 3. Check npm Package Page

Visit: https://www.npmjs.com/package/vettcode-cli

Should show:

- ✅ Version 1.1.0
- ✅ Updated dependencies (ink, react, ink-spinner)
- ✅ Updated README with TUI features

---

## 🔄 Complete Publishing Script

Run these commands in order:

```powershell
# 1. Update version
npm version minor

# 2. Build
npm run build

# 3. Test locally
node dist/cli.js --help
node dist/ink-ui.js

# 4. Git commit & push
git push origin main
git push --tags

# 5. Publish
npm publish
```

---

## 📝 Update package.json Files Field

Before publishing, update this:

```json
{
  "files": [
    "dist",
    "README.md",
    "TUI_SETUP.md",
    "INSTALLATION.md",
    ".env.example",
    "LICENSE"
  ]
}
```

Users don't need the `src/` directory - only the built `dist/` files.

---

## 🎯 Post-Publishing Checklist

- [ ] Version bumped (1.0.8 → 1.1.0)
- [ ] Built successfully (`npm run build`)
- [ ] Tested CLI mode
- [ ] Tested TUI mode
- [ ] Git committed and pushed
- [ ] Published to npm (`npm publish`)
- [ ] Verified on npm registry
- [ ] Tested global installation
- [ ] Updated GitHub README
- [ ] Created GitHub release (optional)

---

## 🚨 Troubleshooting

### Issue: "You must be logged in to publish packages"

**Solution:**

```powershell
npm login
npm whoami  # Verify login
npm publish
```

### Issue: "You cannot publish over the previously published versions"

**Solution:**

```powershell
# Version already exists, bump version
npm version patch  # or minor/major
npm publish
```

### Issue: "Package name too similar to existing package"

**Solution:**

```powershell
# Use scoped package name
npm init --scope=@yourusername
# Then update package.json: "@yourusername/vettcode-cli"
```

### Issue: 2FA Required

**Solution:**

```powershell
npm publish --otp=123456
# Replace 123456 with your 2FA code
```

---

## 📊 Recommended Version for This Update

**Recommended: Minor Version (1.1.0)**

Why?

- ✅ New major feature (Interactive TUI)
- ✅ Backward compatible (CLI still works)
- ✅ No breaking changes
- ✅ Significant user-facing improvements

```powershell
npm version minor
# Updates to 1.1.0
```

---

## 🎉 Release Notes Template

Create a GitHub Release with these notes:

````markdown
## VettCode CLI v1.1.0 - Interactive TUI

### 🎨 New Features

- **Interactive TUI Dashboard** - Full-screen React-based terminal interface
- **Keyboard Navigation** - 15+ keyboard shortcuts for efficient workflow
- **Real-time Progress Tracking** - Live scanning updates with phase indicators
- **Modern Design** - Premium UI inspired by Vercel, Prisma, and Raycast CLIs
- **Multiple Screens** - Home, Scan, Results, Help

### ⌨️ Keyboard Shortcuts

- `S` - Start Smart Scan
- `Shift+S` - Start Manual Scan
- `Q` - Exit
- `R` - View Reports
- `H` - Show Help
- `A` - Toggle AI Mode
- `↑↓` - Navigate Menu
- `Enter` - Select

### 🚀 Usage

```bash
# Launch interactive TUI (new!)
vettcode

# Traditional CLI (still works)
vettcode <directory>
```
````

### 📦 Installation

```bash
npm install -g vettcode-cli@latest
```

### 🔧 Technical Details

- Built with **Ink** (React for CLI)
- Added dependencies: `ink@3.2.0`, `react@17.0.2`, `ink-spinner@4.0.3`
- Maintains full backward compatibility with CLI mode
- Zero breaking changes

### 📚 Documentation

- [TUI Setup Guide](./TUI_SETUP.md)
- [Installation Guide](./INSTALLATION.md)
- [Main README](./README.md)

````

---

## 🎯 Quick Publish Command

One-liner (after testing):

```powershell
npm version minor && npm run build && git push --follow-tags && npm publish
````

This will:

1. Bump version to 1.1.0
2. Build the project
3. Push to git with tags
4. Publish to npm

---

## ✨ Done!

Your new Interactive TUI version is now live on npm! 🎉

Users can now run:

```bash
npm install -g vettcode-cli
vettcode
```

And enjoy the beautiful interactive dashboard! 🛡️












# 1. Quick check (default)
vettcode .

# 2. Full analysis with AI
vettcode . --mode deep

# 3. Fast static-only scan
vettcode . --no-ai

# 4. Scan and save results
vettcode . -o results.json

# 5. Scan with custom ignore patterns
vettcode . -i "node_modules,dist,build"

# 6. View help
vettcode --help

# 7. Check version
vettcode --version


Test 3: Quick scan with JSON output

vettcode . --no-ai -o test-report.json
Test 4: Deep scan



vettcode . --mode deep

Scan yourself (meta-scan!)



cd C:\Users\USER\Desktop\ALLOUTGADGATS\Vettcode-engine-cli
vettcode .

# Deep scan mode (more thorough)
vettcode . --mode deep

# Without AI (faster, static analysis only)
vettcode . --no-ai

# Save report to file
vettcode . -o scan-report.json

# Combine options
vettcode . --mode deep -o detailed-report.json
