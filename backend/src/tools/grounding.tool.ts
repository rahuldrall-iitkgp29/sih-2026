import { MLClient } from '../services/ml-client';
import FormData from 'form-data';
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
  if (model && (model.status === 'available' || model.status === 'AVAILABLE')) {
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
  }`);
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
