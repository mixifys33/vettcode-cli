# Quick Publish v1.1.1 - Fix Screen Rendering

## What Was Fixed

🐛 **Fixed strikethrough/crossed-out text rendering issue**

- Added screen clearing on app mount
- Added fullscreen rendering options
- Prevents terminal output overlap

## Publish Commands

```powershell
# Commit
git add .
git commit -m "fix: Clear screen on launch to prevent text overlap/strikethrough"
git push origin main

# Tag
git tag -a v1.1.1 -m "Fix screen rendering overlap"
git push --tags

# Publish
npm publish
```

## Test

```powershell
npm install -g vettcode-cli@latest
vettcode
```

Should now show clean text without strikethrough effects!
