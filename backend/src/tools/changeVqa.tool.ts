import axios from 'axios';
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
        timeout: 30000,
      });

      if (response.data.success) {
        state.answer = response.data.answer;
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        state.evidence = response.data.evidence || [];
        addTraceStep(state, 'Specialist Change VQA executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist Change VQA failed: ${error.message}`);
      addTraceStep(state, 'Specialist Change VQA', 'failed', 'Falling back');
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
