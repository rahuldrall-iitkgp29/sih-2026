import { MLClient } from '../services/ml-client';
import FormData from 'form-data';
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
