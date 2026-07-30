import { getOpenRouterKeys, getOpenRouterModels } from "./config";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

let keyIndex = 0;

export function getApiKeys(): string[] {
  return getOpenRouterKeys();
}

export function getModels(): string[] {
  return getOpenRouterModels();
}

// Rate limiting per API key to prevent exhaustion
const keyUsageMap = new Map<string, { count: number; resetTime: number; lockUntil?: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute window
const MAX_REQUESTS_PER_KEY = 50; // Reduced from 100 to be more conservative
const LOCK_DURATION = 120000; // 2 minutes lock after exceeding limit

export function nextApiKey(): string {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error(
      "No OpenRouter API keys configured. Set OPENROUTER_API_KEY_1, _2, _3 or OPENROUTER_API_KEYS."
    );
  }
  
  const now = Date.now();
  
  // Try to find a key that hasn't exceeded rate limit and isn't locked
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(keyIndex + i) % keys.length];
    const usage = keyUsageMap.get(key);
    
    // Check if key is locked
    if (usage?.lockUntil && now < usage.lockUntil) {
      continue; // Skip locked keys
    }
    
    // Reset usage if window has expired
    if (usage && now - usage.resetTime > RATE_LIMIT_WINDOW) {
      keyUsageMap.set(key, { count: 1, resetTime: now });
      keyIndex = (keyIndex + i + 1) % keys.length;
      return key;
    }
    
    // Check if key is under rate limit
    if (!usage) {
      keyUsageMap.set(key, { count: 1, resetTime: now });
      keyIndex = (keyIndex + i + 1) % keys.length;
      return key;
    }
    
    if (usage.count < MAX_REQUESTS_PER_KEY) {
      keyUsageMap.set(key, { ...usage, count: usage.count + 1 });
      keyIndex = (keyIndex + i + 1) % keys.length;
      return key;
    }
    
    // Lock the key if it exceeded the limit
    if (!usage.lockUntil) {
      console.warn(`[OpenRouter] API key ${i + 1} exceeded rate limit, locking for 2 minutes`);
      keyUsageMap.set(key, { ...usage, lockUntil: now + LOCK_DURATION });
    }
  }
  
  // All keys are rate limited or locked
  const unlockTime = Math.min(...Array.from(keyUsageMap.values()).map(u => u.lockUntil || u.resetTime + RATE_LIMIT_WINDOW));
  const waitTime = Math.ceil((unlockTime - now) / 1000);
  throw new Error(`All API keys are rate limited. Please wait ${waitTime} seconds before retrying.`);
}

export function keyForIndex(index: number): string {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("No OpenRouter API keys configured.");
  return keys[index % keys.length];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  keyOverride?: string,
  retries = 2
): Promise<ChatResult> {
  // Input validation to prevent prompt injection
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }
  
  // Validate each message structure
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      throw new Error('Invalid message structure');
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      throw new Error(`Invalid message role: ${msg.role}`);
    }
    if (typeof msg.content !== 'string') {
      throw new Error('Message content must be a string');
    }
    // Limit message length to prevent abuse
    if (msg.content.length > 1000000) { // 1MB limit
      throw new Error('Message content exceeds maximum length');
    }
    // Check for suspicious patterns that might indicate prompt injection
    const suspiciousPatterns = [
      /ignore\s+(?:all\s+)?previous\s+(?:instructions?|prompts?)/gi,
      /disregard\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions?|commands?)/gi,
      /forget\s+(?:everything|all)\s+(?:before|above)/gi,
      /new\s+instructions?:/gi,
    ];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(msg.content)) {
        console.warn('[Security] Suspicious prompt injection pattern detected');
        // Don't block, but log for monitoring
      }
    }
  }
  
  const apiKey = keyOverride ?? nextApiKey();
  const models = getModels();
  
  // Validate and construct site URL
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = publicUrl || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

  const body: Record<string, unknown> = {
    models,
    messages,
    temperature: 0.0, // PRODUCTION: Zero temperature for deterministic, consistent JSON responses
    max_tokens: 6000,
  };

  if (models.length === 1) {
    body.model = models[0];
    delete body.models;
  }

  const nodeEnv = process.env.NODE_ENV?.trim() || 'production';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (nodeEnv === 'development') {
        console.log(`[OpenRouter] Attempt ${attempt + 1}/${retries + 1} - Calling ${OPENROUTER_URL}`);
        console.log(`[OpenRouter] Models: ${JSON.stringify(models)}`);
        console.log(`[OpenRouter] Message count: ${messages.length}, Total chars: ${messages.reduce((sum, m) => sum + m.content.length, 0)}`);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (reduced from 60)
      
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": siteUrl,
          "X-Title": "Vettcode Engine",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (nodeEnv === 'development') {
        console.log(`[OpenRouter] Response status: ${res.status}`);
      }

      if (!res.ok) {
        const errText = await res.text();
        
        // Only log in development
        if (nodeEnv === 'development') {
          console.error(`[OpenRouter] Error response:`, errText.slice(0, 500));
        }
        
        // Check for rate limit or temporary errors
        if (res.status === 429 || res.status === 503) {
          if (attempt < retries) {
            if (nodeEnv === 'development') {
              console.warn(`[OpenRouter] Rate limited or service unavailable, retrying in ${2000 * (attempt + 1)}ms...`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
            continue;
          }
          
          // On final attempt with rate limit, check if it's the free tier limit
          if (res.status === 429 && errText.includes('free-models-per-day')) {
            // PRODUCTION: Show helpful message only once per session
            if (!global.__vettcodeRateLimitShown) {
              console.warn('\n⚠️  OpenRouter free tier limit reached (50 requests/day)');
              console.warn('💡 Add $1 credit to unlock 1000 requests/day: https://openrouter.ai/credits');
              console.warn('✓  Continuing with enhanced static analysis...\n');
              global.__vettcodeRateLimitShown = true;
            }
          }
        }
        
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 500)}`);
      }

      const data = (await res.json()) as {
        model?: string;
        choices?: { message?: { content?: string } }[];
      };

      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (nodeEnv === 'development') {
        console.log(`[OpenRouter] Response model: ${data.model || 'unknown'}`);
        console.log(`[OpenRouter] Content length: ${content?.length || 0} chars`);
      }
      
      if (!content) {
        if (attempt < retries) {
          if (nodeEnv === 'development') {
            console.warn(`[OpenRouter] Empty response, retrying (${attempt + 1}/${retries})...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error("Empty response from OpenRouter after retries");
      }

      if (nodeEnv === 'development') {
        console.log(`[OpenRouter] ✓ Success on attempt ${attempt + 1}`);
      }
      return { content, model: data.model ?? models[0] };
    } catch (error) {
      // PRODUCTION: Only log errors in development mode
      if (nodeEnv === 'development' && error instanceof Error) {
        console.error(`[OpenRouter] Request error: ${error.message}`);
      }
      
      if (attempt === retries) {
        if (nodeEnv === 'development') {
          console.error(`[OpenRouter] ✗ All attempts failed:`, error);
        }
        // PRODUCTION: Throw silently - will be caught by caller
        throw new Error(`API request failed after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      if (nodeEnv === 'development') {
        console.warn(`[OpenRouter] Attempt ${attempt + 1} failed, retrying...`, error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Failed after all retries");
}

export function parseJsonFromModel<T>(raw: string): T {
  const trimmed = raw.trim();
  
  // Validate input is a string and not empty
  if (typeof trimmed !== 'string' || trimmed.length === 0) {
    throw new Error('Invalid input: empty or non-string value');
  }
  
  // PRODUCTION: Remove all common AI prefixes and suffixes AGGRESSIVELY
  let cleaned = trimmed;
  
  // Remove entire lines that are explanations (multiline support)
  cleaned = cleaned.replace(/^(?:User Safety|Safety|Note|Here (?:is|are)|The (?:analysis|findings|results?)|I found|Based on).*$/gim, '');
  
  // Remove markdown code blocks (all variants)
  cleaned = cleaned.replace(/```(?:json|javascript|js)?\s*/gi, '');
  
  // Remove "Response:" or similar prefixes
  cleaned = cleaned.replace(/^(?:Response|Answer|Result|Output):\s*/gim, '');
  
  // Trim again after removals
  cleaned = cleaned.trim();
  
  // PRODUCTION: Extract JSON - find FIRST { or [ to LAST matching } or ]
  const jsonStart = cleaned.indexOf('{');
  const jsonArrayStart = cleaned.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;
  
  // Determine which comes first
  if (jsonStart !== -1 && (jsonArrayStart === -1 || jsonStart < jsonArrayStart)) {
    startIndex = jsonStart;
    // Find matching closing brace
    let depth = 0;
    for (let i = jsonStart; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  } else if (jsonArrayStart !== -1) {
    startIndex = jsonArrayStart;
    // Find matching closing bracket
    let depth = 0;
    for (let i = jsonArrayStart; i < cleaned.length; i++) {
      if (cleaned[i] === '[') depth++;
      if (cleaned[i] === ']') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }
  
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No JSON structure found in response');
  }
  
  let jsonStr = cleaned.substring(startIndex, endIndex + 1);
  
  // PRODUCTION: Try multiple parsing strategies
  const parseStrategies = [
    // Strategy 1: Direct parse
    () => JSON.parse(jsonStr),
    
    // Strategy 2: Fix common issues
    () => {
      const fixed = jsonStr
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')  // Fix unquoted keys
        .replace(/:\s*'([^']*)'/g, ':"$1"');  // Convert single quotes to double
      return JSON.parse(fixed);
    },
    
    // Strategy 3: More aggressive fixes
    () => {
      const aggressive = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/:\s*'([^']*)'/g, ':"$1"')
        .replace(/\n/g, ' ')  // Remove newlines
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .replace(/\\/g, '\\\\');  // Escape backslashes properly
      return JSON.parse(aggressive);
    },
    
    // Strategy 4: Ultra-aggressive - fix multiline strings
    () => {
      const ultra = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/:\s*"([^"]*?)"\s*([,}\]])/gs, (match, content, terminator) => {
          // Remove internal newlines in string values
          const cleaned = content.replace(/\n/g, ' ').replace(/\s+/g, ' ');
          return `:"${cleaned}"${terminator}`;
        });
      return JSON.parse(ultra);
    }
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < parseStrategies.length; i++) {
    try {
      const parsed = parseStrategies[i]();
      
      // PRODUCTION: Validate it's not a function
      if (typeof parsed === 'function') {
        throw new Error('Invalid JSON: function detected');
      }
      
      const nodeEnv = process.env.NODE_ENV?.trim() || 'production';
      if (nodeEnv === 'development' && i > 0) {
        console.log(`[JSON Parse] Success using strategy ${i + 1}/${parseStrategies.length}`);
      }
      
      return parsed as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // PRODUCTION: All strategies failed
  const nodeEnv = process.env.NODE_ENV?.trim() || 'production';
  if (nodeEnv === 'development') {
    console.error('[JSON Parse] All strategies failed. First 500 chars of extracted JSON:', jsonStr.substring(0, 500));
  }
  throw new Error(`Invalid JSON response from AI: ${lastError?.message || 'Parse error'}`);
}
