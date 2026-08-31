import axios from 'axios';
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
  if (model && model.status === 'available') {
    try {
      const formData = new FormData();
      const buf1 = require('fs').readFileSync(image1.path);
      const buf2 = require('fs').readFileSync(image2.path);
      formData.append('image1', new Blob([buf1]), image1.filename);
      formData.append('image2', new Blob([buf2]), image2.filename);
      formData.append('query', state.query);

      const response = await axios.post(model.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (response.data.success) {
        state.answer = response.data.description;
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        if (response.data.mask) {
          state.evidence.push({
            type: 'mask',
            data: { mask: response.data.mask, changePercentage: response.data.changePercentage },
            description: 'Change detection mask',
          });
        }
        state.evidence.push({
          type: 'comparison',
          data: { before: image1.id, after: image2.id },
          description: 'Before/After comparison',
        });
        addTraceStep(state, 'Specialist change model executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist change model failed: ${error.message}`);
      addTraceStep(state, 'Specialist change model', 'failed', 'Falling back');
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
