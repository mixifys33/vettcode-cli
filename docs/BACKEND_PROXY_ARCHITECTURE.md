# Backend Proxy Architecture

## Overview

VettCode CLI uses a **secure backend proxy architecture** where all API keys are stored on the backend server, never in the CLI package. This prevents API key theft and abuse.

## Architecture Diagram

```
┌─────────────────┐
│   User's CLI    │  (No API keys stored)
│  (npm package)  │
└────────┬────────┘
         │
         │ HTTPS Request
         │
         ▼
┌─────────────────────────────────┐
│   VettCode Backend (Vercel)     │
│  https://vettcodecli.vercel.app │
│                                  │
│  • OpenRouter API Key  🔒       │
│  • Groq API Key        🔒       │
│  • ImageKit Keys       🔒       │
└────────┬────────────────────────┘
         │
         │ Authenticated API Calls
         │
         ▼
┌─────────────────────────────────┐
│   AI Providers & Services       │
│                                  │
│  • OpenRouter.ai                │
│  • Groq.com                     │
│  • ImageKit.io                  │
└─────────────────────────────────┘
```

## How It Works

### 1. **User Installs CLI**

```bash
npm install -g vettcode-cli
```

- CLI package contains NO API keys
- Only has backend URL: `https://vettcodecli.vercel.app/api`

### 2. **User Runs Scan**

```bash
vettcode /path/to/project
```

- CLI collects code files
- Extracts high-risk code sections
- Sends to backend for analysis

### 3. **Backend Processes Request**

```
POST /api/analyze
{
  "messages": [...],
  "projectName": "my-app",
  "batchIndex": 0
}
```

- Backend receives analysis request
- Uses **server-side API keys** (from `.env.local`)
- Calls OpenRouter or Groq
- Returns findings to CLI

### 4. **CLI Shows Results**

- Displays security findings
- Generates HTML report
- Uploads report to ImageKit (via backend)

## Security Benefits

### ✅ **What's Secure**

1. **API Keys Protected**
   - Keys stored only on Vercel backend
   - Never exposed in npm package
   - Cannot be extracted by users

2. **Rate Limit Management**
   - Backend handles rate limiting
   - Automatic fallback (OpenRouter → Groq)
   - Prevents individual key exhaustion

3. **Cost Control**
   - Monitor API usage centrally
   - Set spending limits on backend
   - Revoke keys without updating CLI

4. **Abuse Prevention**
   - Backend can implement:
     - Request throttling
     - User authentication
     - Usage quotas
     - IP blocking

### ❌ **What Would Be Insecure**

1. Hardcoding keys in CLI source code
2. Including `.env` file in npm package
3. Direct API calls from CLI

## File Structure

### CLI Package (Published to npm)

```
vettcode-cli/
├── dist/
│   └── cli.js          # No keys
├── src/
│   ├── api-client.ts   # Calls backend
│   └── config.ts       # Backend URL only
├── .env.example        # Template (no real keys)
└── .gitignore          # Ignores .env
```

### Backend (Private on Vercel)

```
vettcode-cli-landing/
├── app/api/
│   ├── analyze/
│   │   └── route.ts    # AI analysis proxy
│   └── reports/
│       └── upload/
│           └── route.ts # Report storage proxy
├── .env.local          # 🔒 REAL API KEYS (private)
└── .gitignore          # Ignores .env.local
```

## Backend API Endpoints

### `POST /api/analyze`

Analyze code with AI

**Request:**

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "projectName": "my-app",
  "batchIndex": 0
}
```

**Response:**

```json
{
  "findings": [
    {
      "severity": "critical",
      "title": "SQL Injection",
      "file": "api.ts",
      "line": 42,
      ...
    }
  ],
  "model": "llama-3.3-70b-versatile",
  "provider": "groq"
}
```

### `POST /api/reports/upload`

Upload report to ImageKit

**Request:**

```json
{
  "reportData": { ... },
  "reportId": "uuid",
  "projectName": "my-app"
}
```

**Response:**

```json
{
  "reportId": "uuid",
  "url": "https://ik.imagekit.io/...",
  "webUrl": "https://vettcodecli.vercel.app/report/uuid"
}
```

## Environment Variables

### Backend `.env.local` (Vercel)

```bash
# AI Providers
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODELS=openrouter/free,deepseek/...
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Storage
IMAGEKIT_PRIVATE_KEY=private_...
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...

# Site
NEXT_PUBLIC_SITE_URL=https://vettcodecli.vercel.app
```

### CLI `.env` (Optional, for development)

```bash
# Backend URL (uses default if not set)
VETTCODE_API_URL=https://vettcodecli.vercel.app/api

# Debug mode
NODE_ENV=development
```

## Testing Backend Locally

To test the backend locally before deploying:

```bash
# 1. Start backend dev server
cd vettcode-cli-landing
npm run dev
# Backend runs at http://localhost:3000

# 2. In CLI .env, point to local backend
echo "VETTCODE_API_URL=http://localhost:3000/api" > .env

# 3. Run CLI
cd ../Vettcode-scanner-cli
npm run build
node dist/cli.js /path/to/scan
```

## Deployment

### Deploy Backend to Vercel

```bash
cd vettcode-cli-landing
vercel --prod
```

Ensure environment variables are set in Vercel dashboard.

### Publish CLI to npm

```bash
cd Vettcode-scanner-cli
npm run build
npm publish
```

CLI will automatically use production backend URL.

## Advantages vs Direct API Calls

| Feature            | Backend Proxy          | Direct API Calls      |
| ------------------ | ---------------------- | --------------------- |
| **Security**       | ✅ Keys safe on server | ❌ Keys exposed       |
| **Rate Limiting**  | ✅ Managed centrally   | ❌ Per-user keys      |
| **Cost Control**   | ✅ Monitor & limit     | ❌ User can abuse     |
| **Updates**        | ✅ Update keys anytime | ❌ Must republish CLI |
| **Analytics**      | ✅ Track all usage     | ❌ No visibility      |
| **Authentication** | ✅ Can add auth        | ❌ Not possible       |

## Future Enhancements

1. **User Authentication**
   - Add API keys for users
   - Track usage per user
   - Implement quotas

2. **Usage Analytics**
   - Monitor scan counts
   - Track popular findings
   - Measure success rates

3. **Rate Limiting**
   - Per-IP throttling
   - Per-user quotas
   - Prevent abuse

4. **Caching**
   - Cache common findings
   - Reduce API costs
   - Faster responses

## Troubleshooting

### CLI can't reach backend

```bash
# Check backend URL
echo $VETTCODE_API_URL

# Test backend manually
curl https://vettcodecli.vercel.app/api/analyze
```

### Backend API errors

- Check Vercel logs: `vercel logs`
- Verify environment variables in Vercel dashboard
- Test API keys directly with curl

## Summary

✅ **Backend proxy architecture keeps your API keys secure**
✅ **Users get full functionality without any setup**
✅ **You maintain full control over API usage and costs**
✅ **Easy to update, monitor, and scale**

This is the industry-standard approach used by services like:

- Vercel CLI
- Netlify CLI
- Heroku CLI
- GitHub CLI

All keep credentials on the backend, not in the distributed CLI package.
