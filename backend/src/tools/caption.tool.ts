import axios from 'axios';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { AIProviderFactory } from '../models/llm.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_CAPTION_PROMPT = `You are an expert remote-sensing image analyst. Provide a detailed scene description of this satellite/aerial image.

Your description should cover:
1. Overall scene type (urban, rural, coastal, mountainous, etc.)
2. Land cover composition (percentage estimates if possible)
3. Key features and structures visible
4. Spatial patterns and layout
5. Notable environmental or geographical characteristics

Be thorough, accurate, and use technical remote-sensing terminology where appropriate.
Provide a confidence level (0-100%) for your description.`;

/**
 * Image captioning tool for remote-sensing images.
 */
export async function executeCaption(state: SatQueryState): Promise<SatQueryState> {
  const image = state.images[0];
  const model = modelRegistry.findModel(state.detectedTask!, state.inputType);

  // Try specialist model
  if (model && model.status === 'available') {
    try {
      const formData = new FormData();
      const imageBuffer = require('fs').readFileSync(image.path);
      formData.append('image', new Blob([imageBuffer]), image.filename);

      const response = await axios.post(model.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success) {
        state.answer = response.data.caption;
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        addTraceStep(state, 'Specialist captioning model executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist caption failed: ${error.message}`);
      addTraceStep(state, 'Specialist caption model', 'failed', 'Falling back');
    }
  }

  // Fallback
  if (!VisionProvider.isAvailable()) {
    state.error = 'No captioning model or fallback vision AI available.';
    return state;
  }

  try {
    const base64 = imageToBase64(image.path);
    const mimeType = getBase64MimeType(image.path);
    const answer = await VisionProvider.analyzeImage(RS_CAPTION_PROMPT, base64, mimeType);
    state.answer = answer;
    state.confidence = 0.75;
    state.modelUsed = `${AIProviderFactory.get().name} Vision (Fallback)`;
    state.modelSource = ModelSource.FALLBACK;
    addTraceStep(state, 'Fallback captioning executed', 'completed');
  } catch (error: any) {
    state.error = `Captioning failed: ${error.message}`;
    addTraceStep(state, 'Caption execution', 'failed', error.message);
  }

  return state;
}
