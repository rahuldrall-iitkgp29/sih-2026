import axios from 'axios';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { AIProviderFactory } from '../models/llm.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_GROUNDING_PROMPT = `You are an expert remote-sensing image analyst specializing in spatial grounding.

The user wants to locate specific objects or regions in this satellite/aerial image.

Query: {query}

Analyze the image and:
1. Identify the requested objects/regions
2. Describe their approximate locations using spatial terms (top-left, center, bottom-right, etc.)
3. Estimate approximate bounding box coordinates as percentages of image dimensions [x_min%, y_min%, x_max%, y_max%]
4. Describe the surrounding context
5. Rate confidence (0-100%)

Format your response clearly with identified regions and their locations.`;

/**
 * Region grounding tool for remote-sensing images.
 */
export async function executeGrounding(state: SatQueryState): Promise<SatQueryState> {
  const image = state.images[0];
  const model = modelRegistry.findModel(state.detectedTask!, state.inputType);

  // Try specialist model
  if (model && model.status === 'available') {
    try {
      const formData = new FormData();
      const imageBuffer = require('fs').readFileSync(image.path);
      formData.append('image', new Blob([imageBuffer]), image.filename);
      formData.append('query', state.query);

      const response = await axios.post(model.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success) {
        state.answer = response.data.labels?.join(', ') || 'Regions identified';
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        state.evidence = (response.data.boxes || []).map((box: number[], i: number) => ({
          type: 'bounding_box' as const,
          data: { box, label: response.data.labels?.[i] || '' },
          description: response.data.labels?.[i] || 'Detected region',
        }));
        addTraceStep(state, 'Specialist grounding model executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist grounding failed: ${error.message}`);
      addTraceStep(state, 'Specialist grounding model', 'failed', 'Falling back');
    }
  }

  // Fallback
  if (!VisionProvider.isAvailable()) {
    state.error = 'No grounding model or fallback vision AI available.';
    return state;
  }

  try {
    const base64 = imageToBase64(image.path);
    const mimeType = getBase64MimeType(image.path);
    const prompt = RS_GROUNDING_PROMPT.replace('{query}', state.query);
    const answer = await VisionProvider.analyzeImage(prompt, base64, mimeType);
    state.answer = answer;
    state.confidence = 0.65;
    state.modelUsed = `${AIProviderFactory.get().name} Vision (Fallback)`;
    state.modelSource = ModelSource.FALLBACK;
    addTraceStep(state, 'Fallback grounding executed', 'completed');
  } catch (error: any) {
    state.error = `Grounding failed: ${error.message}`;
    addTraceStep(state, 'Grounding execution', 'failed', error.message);
  }

  return state;
}
