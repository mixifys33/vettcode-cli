/**
 * Ollama Local AI Provider
 * Provides offline AI analysis using locally-hosted Ollama models
 * Model: qwen2.5-coder:1.5b-instruct (1.5B parameters, optimized for code)
 */

import { Ollama } from 'ollama';
import type { AIAnalysisRequest, AIAnalysisResponse } from './api-client';

const OLLAMA_MODEL = 'qwen2.5-coder:1.5b-instruct';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export class OllamaProvider {
  private ollama: Ollama;
  private isAvailable: boolean = false;
  private modelPulled: boolean = false;

  constructor() {
    this.ollama = new Ollama({ host: OLLAMA_HOST });
  }

  /**
   * Check if Ollama is installed and running
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.ollama.list();
      this.isAvailable = true;
      return true;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Check if the model is already downloaded
   */
  async checkModelExists(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some(
        (m: any) => m.name === OLLAMA_MODEL || m.name.startsWith('qwen2.5-coder:1.5b')
      );
      this.modelPulled = modelExists;
      return modelExists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Download the model if not present
   * Returns progress updates via callback
   */
  async ensureModel(onProgress?: (status: string, percent?: number) => void): Promise<boolean> {
    try {
      // Check if model exists
      if (await this.checkModelExists()) {
        onProgress?.('Model ready', 100);
        return true;
      }

      onProgress?.('Downloading qwen2.5-coder:1.5b-instruct (~1-2GB)...', 0);

      // Pull the model with progress tracking
      const stream = await this.ollama.pull({
        model: OLLAMA_MODEL,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.status) {
          const percent = chunk.completed && chunk.total 
            ? Math.round((chunk.completed / chunk.total) * 100)
            : undefined;
          onProgress?.(chunk.status, percent);
        }
      }

      this.modelPulled = true;
      onProgress?.('Model ready', 100);
      return true;
    } catch (error: any) {
      console.error('Failed to download model:', error.message);
      return false;
    }
  }

  /**
   * Analyze code using local Ollama model
   */
  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    if (!this.isAvailable) {
      throw new Error('Ollama is not available. Please install Ollama from https://ollama.com');
    }

    if (!this.modelPulled) {
      throw new Error('Model not downloaded. Run with --setup-ollama first.');
    }

    try {
      // Build prompt from messages
      const systemPrompt = request.messages.find(m => m.role === 'system')?.content || '';
      const userPrompt = request.messages.find(m => m.role === 'user')?.content || '';
      
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      // Generate analysis with streaming
      const response = await this.ollama.generate({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.3, // Low temperature for more deterministic security analysis
          top_p: 0.9,
          top_k: 40,
          num_predict: 2048, // Max tokens for response
        },
      });

      // Parse JSON response
      let findings: any[] = [];
      try {
        // Extract JSON from response (model might add markdown fences)
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          findings = parsed.findings || [];
        }
      } catch (parseError) {
        console.warn('Failed to parse Ollama response as JSON, returning empty findings');
      }

      return {
        findings,
        model: OLLAMA_MODEL,
        provider: 'ollama' as any,
      };
    } catch (error: any) {
      throw new Error(`Ollama analysis failed: ${error.message}`);
    }
  }

  /**
   * Get provider status and info
   */
  async getStatus(): Promise<{
    available: boolean;
    modelPulled: boolean;
    model: string;
    host: string;
    version?: string;
  }> {
    const available = await this.checkAvailability();
    const modelPulled = available ? await this.checkModelExists() : false;

    let version: string | undefined;
    if (available) {
      try {
        const versionInfo = await this.ollama.list();
        version = 'connected';
      } catch (error) {
        // Ignore version fetch errors
      }
    }

    return {
      available,
      modelPulled,
      model: OLLAMA_MODEL,
      host: OLLAMA_HOST,
      version,
    };
  }

  /**
   * Get installation instructions
   */
  static getInstallInstructions(): string {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      return `Install Ollama on macOS:
  1. Download from https://ollama.com/download
  2. Or use Homebrew: brew install ollama
  3. Run: ollama serve`;
    } else if (platform === 'win32') {
      return `Install Ollama on Windows:
  1. Download from https://ollama.com/download
  2. Run the installer
  3. Ollama will start automatically`;
    } else {
      return `Install Ollama on Linux:
  1. Run: curl -fsSL https://ollama.com/install.sh | sh
  2. Start service: ollama serve`;
    }
  }
}

/**
 * Singleton instance
 */
let ollamaProviderInstance: OllamaProvider | null = null;

export function getOllamaProvider(): OllamaProvider {
  if (!ollamaProviderInstance) {
    ollamaProviderInstance = new OllamaProvider();
  }
  return ollamaProviderInstance;
}
