import { AIProvider } from './model.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { env } from '../config/env';
import { logger } from '../utils/logger';

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
      default:
        logger.warn(`Unknown AI provider: ${env.AI_PROVIDER}, falling back to Gemini`);
        this.instance = new GeminiProvider(env.AI_API_KEY, env.TEXT_MODEL, env.VISION_MODEL);
    }

    if (!this.instance.isConfigured) {
      logger.warn(`⚠️  AI provider "${env.AI_PROVIDER}" is not configured (missing API key). Fallback features will be unavailable.`);
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
