import { MLClient } from '../services/ml-client';
import FormData from 'form-data';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { AIProviderFactory } from '../models/llm.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_CHANGE_PROMPT = `You are an expert remote-sensing analyst specializing in change detection.

You are given TWO satellite/aerial images of the SAME area taken at DIFFERENT times.
Image 1 is the BEFORE image (earlier date).
Image 2 is the AFTER image (later date).

Analyze both images and:
1. Identify all significant changes between the two dates
2. Categorize changes (urban expansion, deforestation, water level change, agricultural change, etc.)
3. Estimate the approximate percentage of the area that has changed
4. Describe the location and extent of each change
5. Assess the significance of the changes
6. Rate overall confidence (0-100%)

User query: {query}

Provide a comprehensive change analysis report.`;

/**
 * Bi-temporal change analysis tool.
 */
export async function executeChange(state: SatQueryState): Promise<SatQueryState> {
  if (state.images.length < 2) {
    state.error = 'Change analysis requires two images.';
    addTraceStep(state, 'Change analysis', 'failed', 'Missing second image');
    return state;
  }

  const [image1, image2] = state.images;
  const model = modelRegistry.findModel(state.detectedTask!, state.inputType);

  // Try specialist model
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
      state.confidence = response.confidence || 0.88;
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
    state.error = 'No change detection model or fallback vision AI available.';
    return state;
  }

  try {
    const images = [
      { base64: imageToBase64(image1.path), mimeType: getBase64MimeType(image1.path) },
      { base64: imageToBase64(image2.path), mimeType: getBase64MimeType(image2.path) },
    ];
    const prompt = RS_CHANGE_PROMPT.replace('{query}', state.query);
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
    addTraceStep(state, 'Fallback change analysis executed', 'completed');
  } catch (error: any) {
    state.error = `Change analysis failed: ${error.message}`;
    addTraceStep(state, 'Change analysis', 'failed', error.message);
  }

  return state;
}

