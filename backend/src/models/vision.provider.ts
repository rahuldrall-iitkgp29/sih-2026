import { AIProviderFactory } from './llm.provider';
import { logger } from '../utils/logger';

/**
 * Vision provider abstraction — wraps the AI provider for fallback vision analysis.
 * Used when specialist ML models are unavailable.
 */
export class VisionProvider {
  /**
   * Analyze a single image with a prompt (fallback mode).
   */
  static async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const provider = AIProviderFactory.get();
    if (!provider.isConfigured) {
      throw new Error('No AI provider configured for fallback vision analysis');
    }

    logger.info(`Using ${provider.name} as fallback for vision analysis`);
    return provider.analyzeImage(prompt, imageBase64, mimeType);
  }

  /**
   * Analyze multiple images with a prompt (fallback mode).
   */
  static async analyzeImages(
    prompt: string,
    images: { base64: string; mimeType: string }[]
  ): Promise<string> {
    const provider = AIProviderFactory.get();
    if (!provider.isConfigured) {
      throw new Error('No AI provider configured for fallback vision analysis');
    }

    logger.info(`Using ${provider.name} as fallback for multi-image vision analysis`);
    return provider.analyzeImages(prompt, images);
  }

  /**
   * Check if fallback vision is available.
   */
  static isAvailable(): boolean {
    try {
      const provider = AIProviderFactory.get();
      return provider.isConfigured;
    } catch {
      return false;
    }
  }
}
