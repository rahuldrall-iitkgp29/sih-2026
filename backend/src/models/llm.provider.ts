import { AIProvider, AIModelResponse } from './model.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class LocalProvider implements AIProvider {
  name = 'local';
  isConfigured = false;
  async generateText(prompt: string): Promise<string> { throw new Error('Local provider text generation not configured'); }
  async analyzeImage(prompt: string, imageBase64: string): Promise<AIModelResponse> { throw new Error('Local provider vision not configured'); }
  async analyzeTwoImages(prompt: string, image1Base64: string, image2Base64: string): Promise<AIModelResponse> { throw new Error('Local provider vision not configured'); }
}

/**
 * Factory that creates the configured AI provider.
 * Reads AI_PROVIDER from env and returns the appropriate implementation.
 */
export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  static create(): AIProvider {
    if (this.instance) return this.instance;

    switch (env.AI_PROVIDER) {
      case 'gemini':
        this.instance = new GeminiProvider(env.AI_API_KEY, env.TEXT_MODEL, env.VISION_MODEL);
        break;
      case 'openai':
        this.instance = new OpenAIProvider(env.AI_API_KEY, env.TEXT_MODEL, env.VISION_MODEL);
        break;
      case 'local':
      case 'none':
        logger.info(`Using completely local configuration (no cloud AI fallback)`);
        this.instance = new LocalProvider();
        break;
      default:
        logger.warn(`Unknown AI provider: ${env.AI_PROVIDER}, falling back to local mode`);
        this.instance = new LocalProvider();
    }

    if (!this.instance.isConfigured) {
      logger.warn(`??  AI provider "${env.AI_PROVIDER}" is not configured or is set to local mode. Cloud fallback features will be unavailable.`);
    }

    return this.instance;
  }

  /**
   * Get the current provider instance, or create one.
   */
  static get(): AIProvider {
    return this.instance || this.create();
  }

  /**
   * Reset the cached instance (useful for testing or reconfiguration).
   */
  static reset(): void {
    this.instance = null;
  }
}
