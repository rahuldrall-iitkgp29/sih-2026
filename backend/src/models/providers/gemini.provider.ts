import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AIProvider } from '../model.interface';
import { logger } from '../../utils/logger';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private textModel: ChatGoogleGenerativeAI | null = null;
  private visionModel: ChatGoogleGenerativeAI | null = null;
  private apiKey: string;
  private textModelId: string;
  private visionModelId: string;

  constructor(apiKey: string, textModelId?: string, visionModelId?: string) {
    this.apiKey = apiKey;
    this.textModelId = textModelId || 'gemini-2.0-flash';
    this.visionModelId = visionModelId || 'gemini-2.0-flash';

    if (this.apiKey) {
      this.textModel = new ChatGoogleGenerativeAI({
        model: this.textModelId,
        apiKey: this.apiKey,
        temperature: 0.3,
      });
      this.visionModel = new ChatGoogleGenerativeAI({
        model: this.visionModelId,
        apiKey: this.apiKey,
        temperature: 0.3,
      });
      logger.info(`Gemini provider initialized (text: ${this.textModelId}, vision: ${this.visionModelId})`);
    }
  }

  get isConfigured(): boolean {
    return !!this.apiKey && !!this.textModel;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.textModel) throw new Error('Gemini text model not configured');
    const result = await this.textModel.invoke(prompt);
    return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
  }

  async analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    if (!this.visionModel) throw new Error('Gemini vision model not configured');

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
    if (!this.visionModel) throw new Error('Gemini vision model not configured');

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
