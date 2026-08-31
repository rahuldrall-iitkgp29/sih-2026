import { ChatOpenAI } from '@langchain/openai';
import { AIProvider } from '../model.interface';
import { logger } from '../../utils/logger';

/**
 * OpenAI provider scaffold. Fully functional if API key is provided.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private textModel: ChatOpenAI | null = null;
  private visionModel: ChatOpenAI | null = null;
  private apiKey: string;

  constructor(apiKey: string, textModelId?: string, visionModelId?: string) {
    this.apiKey = apiKey;

    if (this.apiKey) {
      this.textModel = new ChatOpenAI({
        model: textModelId || 'gpt-4o-mini',
        apiKey: this.apiKey,
        temperature: 0.3,
      });
      this.visionModel = new ChatOpenAI({
        model: visionModelId || 'gpt-4o',
        apiKey: this.apiKey,
        temperature: 0.3,
      });
      logger.info('OpenAI provider initialized');
    }
  }

  get isConfigured(): boolean {
    return !!this.apiKey && !!this.textModel;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.textModel) throw new Error('OpenAI text model not configured');
    const result = await this.textModel.invoke(prompt);
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }

  async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    if (!this.visionModel) throw new Error('OpenAI vision model not configured');

    const result = await this.visionModel.invoke([
      {
        type: 'human',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
        ],
      },
    ]);

    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }

  async analyzeImages(
    prompt: string,
    images: { base64: string; mimeType: string }[]
  ): Promise<string> {
    if (!this.visionModel) throw new Error('OpenAI vision model not configured');

    const content: any[] = [{ type: 'text', text: prompt }];
    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      });
    }

    const result = await this.visionModel.invoke([{ type: 'human', content }]);
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }
}
