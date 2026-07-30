/**
 * VettCode CLI Configuration
 * All API calls are now proxied through the VettCode backend
 * No API keys are stored in the CLI - everything goes through the secure backend
 */

export const DEFAULT_CONFIG = {
  // Backend API URL (where CLI sends analysis requests)
  VETTCODE_API_URL: 'https://vettcodecli.vercel.app/api',
  
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
