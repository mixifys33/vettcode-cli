/**
 * AI Provider Orchestrator
 * Manages multiple AI providers with intelligent fallback:
 * 1. Ollama (local, offline, free)
 * 2. Backend API (OpenRouter/Groq)
 * 3. No AI (static analysis only)
 */

import { getOllamaProvider, OllamaProvider } from './ollama-provider';
import { analyzeWithAI as analyzeWithBackend } from './api-client';
import type { AIAnalysisRequest, AIAnalysisResponse } from './api-client';

export type AIProvider = 'ollama' | 'backend' | 'none';

export interface ProviderConfig {
  preferredProvider: AIProvider;
  enableFallback: boolean;
  ollamaTimeout?: number; // milliseconds
  backendTimeout?: number;
}

export interface AnalysisResult {
  response: AIAnalysisResponse | null;
  provider: AIProvider;
  fallbackUsed: boolean;
  error?: string;
}

export class AIProviderOrchestrator {
  private ollamaProvider: OllamaProvider;
  private config: ProviderConfig;
  private providerStatus: Map<AIProvider, boolean> = new Map();

  constructor(config: Partial<ProviderConfig> = {}) {
    this.ollamaProvider = getOllamaProvider();
    this.config = {
      preferredProvider: config.preferredProvider || 'ollama',
      enableFallback: config.enableFallback !== false,
      ollamaTimeout: config.ollamaTimeout || 30000, // 30s default
      backendTimeout: config.backendTimeout || 60000, // 60s default
    };
  }

  /**
   * Initialize and check all providers
   */
  async initialize(onProgress?: (message: string) => void): Promise<void> {
    onProgress?.('Checking AI providers...');

    // Check Ollama
    const ollamaAvailable = await this.ollamaProvider.checkAvailability();
    this.providerStatus.set('ollama', ollamaAvailable);
    
    if (ollamaAvailable) {
      const modelExists = await this.ollamaProvider.checkModelExists();
      if (!modelExists) {
        onProgress?.('Ollama found but model not downloaded. Use --setup-ollama to download.');
        this.providerStatus.set('ollama', false);
      } else {
        onProgress?.('Ollama ready with qwen2.5-coder:1.5b');
      }
    }

    // Backend is always available (might fail at runtime)
    this.providerStatus.set('backend', true);
  }

  /**
   * Analyze with automatic provider selection and fallback
   */
  async analyze(request: AIAnalysisRequest, onProgress?: (message: string) => void): Promise<AnalysisResult> {
    const providers = this.getProviderOrder();
    let lastError: string | undefined;

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isFallback = i > 0;

      if (!this.providerStatus.get(provider) && provider !== 'backend') {
        continue; // Skip unavailable providers
      }

      try {
        if (isFallback) {
          onProgress?.(`Falling back to ${provider}...`);
        } else {
          onProgress?.(`Analyzing with ${provider}...`);
        }

        const response = await this.analyzeWithProvider(provider, request);
        
        return {
          response,
          provider,
          fallbackUsed: isFallback,
        };
      } catch (error: any) {
        lastError = error.message;
        console.error(`${provider} failed:`, error.message);

        if (!this.config.enableFallback || i === providers.length - 1) {
          // No more fallbacks or fallback disabled
          break;
        }
      }
    }

    // All providers failed
    return {
      response: null,
      provider: 'none',
      fallbackUsed: true,
      error: lastError || 'All AI providers failed',
    };
  }

  /**
   * Analyze with specific provider
   */
  private async analyzeWithProvider(provider: AIProvider, request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    switch (provider) {
      case 'ollama':
        return this.analyzeWithOllama(request);
      
      case 'backend':
        return this.analyzeWithBackend(request);
      
      case 'none':
        throw new Error('No AI provider selected');
    }
  }

  /**
   * Analyze with Ollama
   */
  private async analyzeWithOllama(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    return Promise.race([
      this.ollamaProvider.analyze(request),
      this.createTimeout(this.config.ollamaTimeout!, 'Ollama analysis timeout'),
    ]);
  }

  /**
   * Analyze with Backend API
   */
  private async analyzeWithBackend(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    return Promise.race([
      analyzeWithBackend(request),
      this.createTimeout(this.config.backendTimeout!, 'Backend API timeout'),
    ]);
  }

  /**
   * Get provider order based on configuration
   * Backend is DEFAULT - Ollama is optional alternative
   */
  private getProviderOrder(): AIProvider[] {
    const { preferredProvider, enableFallback } = this.config;

    if (!enableFallback) {
      return [preferredProvider];
    }

    // Build fallback chain
    if (preferredProvider === 'ollama') {
      // User explicitly chose Ollama - fallback to backend if unavailable
      return ['ollama', 'backend'];
    } else if (preferredProvider === 'backend') {
      // Default case - backend only (no ollama fallback unless user opted in)
      return ['backend'];
    } else {
      // No AI
      return ['none'];
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Setup Ollama (download model)
   */
  async setupOllama(onProgress?: (status: string, percent?: number) => void): Promise<boolean> {
    const available = await this.ollamaProvider.checkAvailability();
    
    if (!available) {
      onProgress?.('Ollama not found. Please install Ollama first.', 0);
      console.log('\n' + OllamaProvider.getInstallInstructions());
      return false;
    }

    return this.ollamaProvider.ensureModel(onProgress);
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<{
    ollama: {
      available: boolean;
      modelPulled: boolean;
      model: string;
      host: string;
    };
    backend: {
      available: boolean;
      endpoint: string;
    };
    preferred: AIProvider;
  }> {
    const ollamaStatus = await this.ollamaProvider.getStatus();
    
    return {
      ollama: ollamaStatus,
      backend: {
        available: true, // We assume backend is available (checked at runtime)
        endpoint: process.env.VETTCODE_BACKEND_URL || 'https://vettcodecli.vercel.app',
      },
      preferred: this.config.preferredProvider,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: AIProviderOrchestrator | null = null;

export function getAIOrchestrator(config?: Partial<ProviderConfig>): AIProviderOrchestrator {
  if (!orchestratorInstance || config) {
    orchestratorInstance = new AIProviderOrchestrator(config);
  }
  return orchestratorInstance;
}
