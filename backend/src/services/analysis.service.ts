import { AnalyzeRequest, AnalysisResult } from '../types';
import { UploadService } from './upload.service';
import { SatQueryAgent } from '../agents/satquery.agent';
import { Analysis } from '../models/analysis.model';
import { logger } from '../utils/logger';

/**
 * Analysis service — orchestrates the full analysis pipeline.
 */
export class AnalysisService {
  /**
   * Run a full analysis.
   */
  static async analyze(request: AnalyzeRequest): Promise<AnalysisResult> {
    const { query, inputType, imageIds } = request;

    // Retrieve images from the upload store
    const images = UploadService.getImages(imageIds);
    if (images.length === 0) {
      throw new Error('No valid images found for the provided IDs. Please upload images first.');
    }

    if (images.length !== imageIds.length) {
      logger.warn(`Requested ${imageIds.length} images, but only ${images.length} found`);
    }

    // Execute the agent pipeline
    const result = await SatQueryAgent.analyze(query, inputType, images);

    // Persist to database if available
    try {
      const doc = new Analysis({
        query: result.query,
        inputType: result.inputType,
        images: result.executionTrace.length > 0 ? images.map(img => ({
          id: img.id,
          filename: img.filename,
          originalName: img.originalName,
          format: img.format,
          width: img.width,
          height: img.height,
          bands: img.bands,
        })) : [],
        detectedTask: result.detectedTask,
        modelsUsed: [result.modelUsed],
        modelSource: result.modelSource,
        toolsUsed: result.toolsUsed,
        answer: result.answer,
        confidence: result.confidence,
        evidence: result.evidence,
        executionTrace: result.executionTrace,
        processingTime: result.processingTime,
      });
      const saved = await doc.save();
      result.id = saved._id.toString();
    } catch (error) {
      logger.warn(`Could not save analysis to database: ${error}`);
      // Continue — analysis result is still valid
    }

    return result;
  }

  /**
   * Get a previous analysis by ID.
   */
  static async getById(id: string): Promise<any> {
    try {
      return await Analysis.findById(id);
    } catch {
      return null;
    }
  }

  /**
   * List recent analyses.
   */
  static async list(limit = 20): Promise<any[]> {
    try {
      return await Analysis.find().sort({ createdAt: -1 }).limit(limit).lean();
    } catch {
      return [];
    }
  }
}
