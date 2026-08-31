import axios from 'axios';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_VQA_PROMPT = `You are an expert remote-sensing image analyst. Analyze this satellite/aerial image and answer the following question in detail.

Focus on:
- Land cover types (urban, vegetation, water, bare soil, etc.)
- Infrastructure and built-up areas
- Natural features (rivers, lakes, forests, mountains)
- Any notable patterns or anomalies

Question: {query}

Provide a detailed, accurate answer based on what you observe in the image. Include a confidence level (0-100%) for your analysis.`;

/**
 * Visual Question Answering tool for remote-sensing images.
 * Tries specialist ML model first, falls back to vision AI.
 */
export async function executeVQA(state: SatQueryState): Promise<SatQueryState> {
  const image = state.images[0];
  const model = modelRegistry.findModel(state.detectedTask!, state.inputType);

  // Try specialist model first
  if (model && model.status === 'available') {
    try {
      const formData = new FormData();
      const imageBuffer = require('fs').readFileSync(image.path);
      const blob = new Blob([imageBuffer]);
      formData.append('image', blob, image.filename);
      formData.append('query', state.query);

      const response = await axios.post(model.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data.success) {
        state.answer = response.data.answer;
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        state.evidence = response.data.evidence || [];
        addTraceStep(state, 'Specialist VQA model executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist VQA failed: ${error.message}. Falling back to vision AI.`);
      addTraceStep(state, 'Specialist VQA model', 'failed', 'Falling back to vision AI');
    }
  }

  // Fallback to vision AI
  if (!VisionProvider.isAvailable()) {
    state.error = 'No VQA model or fallback vision AI available.';
    addTraceStep(state, 'VQA execution', 'failed', 'No model available');
    return state;
  }

  try {
    const base64 = imageToBase64(image.path);
    const mimeType = getBase64MimeType(image.path);
    const prompt = RS_VQA_PROMPT.replace('{query}', state.query);

    const answer = await VisionProvider.analyzeImage(prompt, base64, mimeType);
    state.answer = answer;
    state.confidence = 0.75; // Default fallback confidence
    state.modelUsed = `${require('../models/llm.provider').AIProviderFactory.get().name} Vision (Fallback)`;
    state.modelSource = ModelSource.FALLBACK;
    addTraceStep(state, 'Fallback VQA executed', 'completed', 'Using vision AI');
  } catch (error: any) {
    state.error = `VQA analysis failed: ${error.message}`;
    addTraceStep(state, 'VQA execution', 'failed', error.message);
  }

  return state;
}
