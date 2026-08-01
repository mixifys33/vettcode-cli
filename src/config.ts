/**
 * VettCode CLI Configuration
 * All API calls are now proxied through the VettCode backend
 * No API keys are stored in the CLI - everything goes through the secure backend
 * 
 * NEW: Ollama local AI support for offline scanning
 */

export const DEFAULT_CONFIG = {
  // Backend API URL (where CLI sends analysis requests)
  VETTCODE_API_URL: 'https://vettcodecli.vercel.app/api',
  
  // Ollama configuration
  OLLAMA_HOST: 'http://localhost:11434',
  OLLAMA_MODEL: 'qwen2.5-coder:1.5b-instruct',
  
  // AI Provider preference: 'ollama' | 'backend' | 'none'
  AI_PROVIDER: 'ollama', // Default to local Ollama for privacy and speed
  AI_PROVIDER_FALLBACK: 'true', // Enable fallback to backend if Ollama unavailable
  
  // Default environment
  NODE_ENV: 'production',
};

/**
 * Get configuration value with fallback to default
 * Priority: process.env > DEFAULT_CONFIG
 */
export function getConfig(key: keyof typeof DEFAULT_CONFIG): string {
  // Check if user has overridden via environment variable
  const envValue = process.env[key];
  
  if (envValue) {
    return envValue;
  }
  
  // Return default value
  return DEFAULT_CONFIG[key];
}

/**
 * Get backend API URL
 */
export function getBackendURL(): string {
  return process.env.VETTCODE_API_URL || DEFAULT_CONFIG.VETTCODE_API_URL;
}

/**
 * Get Ollama configuration
 */
export function getOllamaConfig() {
  return {
    host: process.env.OLLAMA_HOST || DEFAULT_CONFIG.OLLAMA_HOST,
    model: process.env.OLLAMA_MODEL || DEFAULT_CONFIG.OLLAMA_MODEL,
  };
}

/**
 * Get AI provider preferences
 */
export function getAIProviderConfig() {
  return {
    preferred: (process.env.AI_PROVIDER || DEFAULT_CONFIG.AI_PROVIDER) as 'ollama' | 'backend' | 'none',
    enableFallback: (process.env.AI_PROVIDER_FALLBACK || DEFAULT_CONFIG.AI_PROVIDER_FALLBACK) === 'true',
  };
}
