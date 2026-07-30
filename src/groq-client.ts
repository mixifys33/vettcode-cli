/**
 * Groq AI Client - Fallback provider with unlimited free tier
 * Used when OpenRouter hits rate limits or fails
 */

import { getGroqKey, getGroqModel as getDefaultGroqModel } from "./config";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
}

export function getGroqApiKey(): string | null {
  const key = getGroqKey();
  return key || null;
}

export function getGroqModel(): string {
  return getDefaultGroqModel();
}

export async function groqChatCompletion(
  messages: ChatMessage[],
  retries = 2
): Promise<ChatResult> {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error("No Groq API key configured. Set GROQ_API_KEY in .env");
  }
  
  const model = getGroqModel();
  const nodeEnv = process.env.NODE_ENV?.trim() || 'production';
  
  const body = {
    model,
    messages,
    temperature: 0.0,
    max_tokens: 6000,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (nodeEnv === 'development') {
        console.log(`[Groq] Attempt ${attempt + 1}/${retries + 1} - Model: ${model}`);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (nodeEnv === 'development') {
        console.log(`[Groq] Response status: ${res.status}`);
      }

      if (!res.ok) {
        const errText = await res.text();
        
        if (nodeEnv === 'development') {
          console.error(`[Groq] Error response:`, errText.slice(0, 500));
        }
        
        // Retry on rate limit or server errors
        if ((res.status === 429 || res.status === 503) && attempt < retries) {
          if (nodeEnv === 'development') {
            console.warn(`[Groq] Retrying in ${1000 * (attempt + 1)}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        throw new Error(`Groq API ${res.status}: ${errText.slice(0, 500)}`);
      }

      const data = (await res.json()) as {
        model?: string;
        choices?: { message?: { content?: string } }[];
      };

      const content = data.choices?.[0]?.message?.content?.trim();
      
      if (nodeEnv === 'development') {
        console.log(`[Groq] Response model: ${data.model || model}`);
        console.log(`[Groq] Content length: ${content?.length || 0} chars`);
      }
      
      if (!content) {
        if (attempt < retries) {
          if (nodeEnv === 'development') {
            console.warn(`[Groq] Empty response, retrying...`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error("Empty response from Groq after retries");
      }

      if (nodeEnv === 'development') {
        console.log(`[Groq] ✓ Success on attempt ${attempt + 1}`);
      }
      
      return { content, model: data.model ?? model };
      
    } catch (error) {
      if (nodeEnv === 'development' && error instanceof Error) {
        console.error(`[Groq] Request error: ${error.message}`);
      }
      
      if (attempt === retries) {
        throw new Error(`Groq API failed after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Groq API failed after all retries");
}
