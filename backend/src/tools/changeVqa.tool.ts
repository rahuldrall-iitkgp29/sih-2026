import { MLClient } from '../services/ml-client';
import FormData from 'form-data';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { AIProviderFactory } from '../models/llm.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_CHANGE_VQA_PROMPT = `You are an expert remote-sensing analyst specializing in change detection Q&A.

You are given TWO satellite/aerial images of the SAME area taken at DIFFERENT times.
Image 1 is the BEFORE image (earlier date).
Image 2 is the AFTER image (later date).

Answer the following question about the changes between these two images:
{query}

Be specific and accurate. If no change is detected relevant to the question, state that clearly.
Rate confidence (0-100%).`;

/**
 * Change-based VQA tool — answers questions about bi-temporal changes.
 */
export async function executeChangeVqa(state: SatQueryState): Promise<SatQueryState> {
  if (state.images.length < 2) {
    state.error = 'Change VQA requires two images.';
    return state;
  }

  const [image1, image2] = state.images;
  const model = modelRegistry.findModel(state.detectedTask!, state.inputType);

  // Try specialist
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

  // Fallback
  if (!VisionProvider.isAvailable()) {
    state.error = 'No Change VQA model or fallback available.';
    return state;
  }

  try {
    const images = [
      { base64: imageToBase64(image1.path), mimeType: getBase64MimeType(image1.path) },
      { base64: imageToBase64(image2.path), mimeType: getBase64MimeType(image2.path) },
    ];
    const prompt = RS_CHANGE_VQA_PROMPT.replace('{query}', state.query);
    const answer = await VisionProvider.analyzeImages(prompt, images);
    state.answer = answer;
    state.confidence = 0.70;
    state.modelUsed = `${AIProviderFactory.get().name} Vision (Fallback)`;
    state.modelSource = ModelSource.FALLBACK;
    state.evidence.push({
      type: 'comparison',
      data: { before: image1.id, after: image2.id },
      description: 'Before/After comparison',
    });
    addTraceStep(state, 'Fallback Change VQA executed', 'completed');
  } catch (error: any) {
    state.error = `Change VQA failed: ${error.message}`;
  }

  return state;
}
