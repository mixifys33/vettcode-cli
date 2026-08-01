/**
 * VettCode CLI Configuration
 * All API calls are now proxied through the VettCode backend
 * No API keys are stored in the CLI - everything goes through the secure backend
 * 
 * NEW: Ollama local AI support for offline scanning (OPTIONAL)
 */

export const DEFAULT_CONFIG = {
  // Backend API URL (where CLI sends analysis requests)
  VETTCODE_API_URL: 'https://vettcodecli.vercel.app/api',
  
  // Ollama configuration (OPTIONAL - for users who want local AI)
  OLLAMA_HOST: 'http://localhost:11434',
  OLLAMA_MODEL: 'qwen2.5-coder:1.5b-instruct',
  
  // AI Provider preference: 'backend' (default) | 'ollama' | 'none'
  // backend = Use VettCode cloud API (default, always works)
  // ollama = Use local Ollama (must be installed separately)
  // none = Static analysis only (no AI)
  AI_PROVIDER: 'backend', // DEFAULT: Use cloud backend (existing behavior)
  AI_PROVIDER_FALLBACK: 'true', // Enable fallback between providers
  
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
