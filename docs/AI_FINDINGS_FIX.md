# AI Findings Fix - July 30, 2026

## Issue

AI Findings were showing as **0** in scan reports even though AI analysis was running and detecting vulnerabilities.

## Root Cause

The findings counting logic in `cli-scan-orchestrator.ts` was only counting findings with `source === "ai"`, but when AI findings matched static analysis findings, they were automatically being marked as `source === "verified"` in the verification layer. This caused all AI-discovered findings that were also found by static analysis to be counted as "verified" instead of "AI findings".

## Solution

### 1. **Improved Groq Fallback** (`cli-scan-orchestrator.ts`)

Enhanced the OpenRouter → Groq fallback logic to:

- Detect rate limit errors immediately (429, "rate limited", "free-models-per-day")
- Switch to Groq without retrying OpenRouter when rate limited
- Show user-friendly message: `⚡ Switching to Groq AI (unlimited free tier)...`
- Fail fast on OpenRouter (0 internal retries) before trying Groq

### 2. **Fixed AI Findings Count** (`cli-scan-orchestrator.ts` line 220)

Changed from:

```typescript
aiFindings: deduplicated.filter(f => f.source === "ai").length,
```

To:

```typescript
aiFindings: deduplicated.filter(f => f.sources?.includes("ai-analysis")).length,
```

This now correctly counts ALL findings that involved AI analysis, regardless of whether they were also confirmed by static analysis.

## Results

### Before Fix

```
Static Findings: 2
AI Findings: 0        ❌ Wrong
Verified (Both): 2
```

### After Fix

```
Static Findings: 3
AI Findings: 1        ✅ Correct
Verified (Both): 1
```

## Technical Details

### Finding Source Types

- **`source: "static"`** - Only found by static analysis
- **`source: "ai"`** - Only found by AI, not confirmed by static
- **`source: "verified"`** - Found by both AI and static analysis (highest confidence)

### Finding Sources Array

The `sources` array tracks ALL detection methods:

- `"ai-analysis"` - Detected by AI
- `"static-analysis"` - Detected by static analyzer
- `"pattern-match"` - Code evidence verified in actual file

## API Provider Chain

1. **OpenRouter** (Primary) - Free tier: 50 requests/day
2. **Groq** (Fallback) - Unlimited free tier with llama-3.3-70b-versatile

When OpenRouter hits rate limit, system automatically switches to Groq without user intervention.

## Files Modified

- `src/cli-scan-orchestrator.ts` - Fixed AI finding counts and improved Groq fallback
- Added global flag `__vettcodeGroqFallbackShown` to show fallback message once

## Testing

Verified with test-scan showing correct counts:

- ✅ AI findings now display correctly (non-zero when AI is used)
- ✅ Groq fallback activates on OpenRouter rate limit
- ✅ All findings properly categorized as static/ai/verified

## No Breaking Changes

- All existing scan functionality preserved
- Enhanced static analysis still works as fallback
- No changes to CLI arguments or flags
- Backward compatible with existing reports
