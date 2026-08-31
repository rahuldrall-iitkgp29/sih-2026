import axios from 'axios';
import { SatQueryState, addTraceStep } from '../agents/state';
import { ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { VisionProvider } from '../models/vision.provider';
import { AIProviderFactory } from '../models/llm.provider';
import { imageToBase64, getBase64MimeType } from '../utils/file.utils';
import { logger } from '../utils/logger';

const RS_OPTICAL_SAR_PROMPT = `You are an expert remote-sensing analyst specializing in multi-modal image fusion.

You are given TWO images of the SAME area:
Image 1: OPTICAL satellite image (captures visible light, color, texture)
Image 2: SAR (Synthetic Aperture Radar) image (captures surface roughness, moisture, structure)

Analyze both images together to provide complementary information:
1. Identify built-up/urban areas (bright in SAR, structured in optical)
2. Identify water bodies (dark in SAR, blue/dark in optical)
3. Identify vegetation (moderate in SAR, green in optical)
4. Note areas where SAR provides information not visible in optical (e.g., through clouds)
5. Note areas where optical provides better detail than SAR

User query: {query}

Provide a comprehensive cross-modal analysis combining insights from both modalities.
Rate confidence (0-100%).`;

/**
 * Optical-SAR cross-modal analysis tool.
 */
export async function executeOpticalSar(state: SatQueryState): Promise<SatQueryState> {
  if (state.images.length < 2) {
    state.error = 'Optical-SAR analysis requires two images (one optical, one SAR).';
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
      formData.append('optical', new Blob([buf1]), image1.filename);
      formData.append('sar', new Blob([buf2]), image2.filename);
      formData.append('query', state.query);

      const response = await axios.post(model.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (response.data.success) {
        state.answer = response.data.analysis;
        state.confidence = response.data.confidence;
        state.modelUsed = response.data.model;
        state.modelSource = ModelSource.SPECIALIST;
        state.evidence = (response.data.regions || []).map((r: any) => ({
          type: 'highlight' as const,
          data: r,
          description: r.label || 'Identified region',
        }));
        addTraceStep(state, 'Specialist Optical-SAR model executed', 'completed');
        return state;
      }
    } catch (error: any) {
      logger.warn(`Specialist Optical-SAR failed: ${error.message}`);
      addTraceStep(state, 'Specialist Optical-SAR model', 'failed', 'Falling back');
    }
  }

  // Fallback
  if (!VisionProvider.isAvailable()) {
    state.error = 'No Optical-SAR model or fallback available.';
    return state;
  }

  try {
    const images = [
      { base64: imageToBase64(image1.path), mimeType: getBase64MimeType(image1.path) },
      { base64: imageToBase64(image2.path), mimeType: getBase64MimeType(image2.path) },
    ];
    const prompt = RS_OPTICAL_SAR_PROMPT.replace('{query}', state.query);
    const answer = await VisionProvider.analyzeImages(prompt, images);
    state.answer = answer;
    state.confidence = 0.65;
    state.modelUsed = `${AIProviderFactory.get().name} Vision (Fallback)`;
    state.modelSource = ModelSource.FALLBACK;
    addTraceStep(state, 'Fallback Optical-SAR analysis executed', 'completed');
  } catch (error: any) {
    state.error = `Optical-SAR analysis failed: ${error.message}`;
  }

  return state;
}
