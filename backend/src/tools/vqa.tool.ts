import { MLClient } from '../services/ml-client';
import FormData from 'form-data';
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
  if (model && (model.status === 'available')) {
    const formData = new FormData();
    // Assuming image paths are added appropriately, depending on the tool.
    // For single images:
    if (state.images.length > 0) {
      const fs = require('fs');
      for (let i = 0; i < state.images.length; i++) {
        const imageBuffer = fs.readFileSync(state.images[i].path);
        // Note: Python FastAPI expects image_t1, image_t2 for change, optical_image/sar_image etc.
        // We will just append them using standard form data conventions or check tool type.
        let fieldName = 'image';
        if (state.detectedTask === 'CHANGE_ANALYSIS' || state.detectedTask === 'CHANGE_VQA') {
            fieldName = i === 0 ? 'image_t1' : 'image_t2';
        } else if (state.detectedTask === 'OPTICAL_SAR_ANALYSIS') {
            fieldName = i === 0 ? 'optical_image' : 'sar_image';
        }
        formData.append(fieldName, imageBuffer, state.images[i].filename);
      }
    }
    
    if (state.query && state.detectedTask !== 'CAPTION' && state.detectedTask !== 'CHANGE_ANALYSIS') {
        formData.append('query', state.query);
    }

    const response = await MLClient.executeTask(model.endpoint, state.detectedTask!, formData);

    if (response.success) {
      state.answer = response.answer || response.caption || response.change_detected;
      state.confidence = response.confidence;
      state.modelUsed = response.model;
      state.modelSource = ModelSource.SPECIALIST;
      state.evidence = response.evidence || [];
      const { addTraceStep } = require('../agents/state');
      addTraceStep(state, `Specialist ${state.detectedTask} model executed`, 'completed');
      return state;
    } else {
      const { logger } = require('../utils/logger');
      logger.warn(`Specialist model failed: ${response.message} (Status: ${response.status}). Falling back...`);
      const { addTraceStep } = require('../agents/state');
      addTraceStep(state, `Specialist model`, 'failed', response.message);
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
