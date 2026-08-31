import { InputType, ImageMetadata, AnalysisResult, ModelSource } from '../types';
import { SatQueryState, createInitialState, addTraceStep } from './state';
import { classifyTask } from './planner';
import { routeToTool } from './router';
import { modelRegistry } from '../models/model.registry';
import { AIProviderFactory } from '../models/llm.provider';
import { logger } from '../utils/logger';

/**
 * SatQuery Agent — the main orchestrator.
 *
 * Pipeline:
 *   Input Validation → Query Understanding → Task Classification →
 *   Tool/Model Selection → Tool Execution → Result Validation →
 *   Response Synthesis → Final Response
 */
export class SatQueryAgent {
  /**
   * Execute a full analysis pipeline.
   */
  static async analyze(
    query: string,
    inputType: InputType,
    images: ImageMetadata[]
  ): Promise<AnalysisResult> {
    // Initialize state
    let state = createInitialState(query, inputType, images);
    logger.info(`Starting analysis: query="${query}", inputType=${inputType}, images=${images.length}`);

    // Step 1: Input validation
    state = this.validateInput(state);
    if (state.error) return this.buildErrorResult(state);

    // Step 2: Refresh model registry
    try {
      await modelRegistry.refreshStatus();
      addTraceStep(state, 'Model registry refreshed', 'completed');
    } catch {
      addTraceStep(state, 'Model registry refresh', 'skipped', 'ML service not reachable');
    }

    // Step 3: Task classification
    state = await classifyTask(state);
    if (state.error) return this.buildErrorResult(state);

    // Step 4: Route to tool and execute
    state = await routeToTool(state);
    if (state.error) return this.buildErrorResult(state);

    // Step 5: Response synthesis
    state = await this.synthesizeResponse(state);

    // Step 6: Finalize
    state.processingTime = Date.now() - state.startTime;
    addTraceStep(state, 'Response synthesized', 'completed', `${state.processingTime}ms`);

    return this.buildResult(state);
  }

  /**
   * Validate input images match the expected input type.
   */
  private static validateInput(state: SatQueryState): SatQueryState {
    const { inputType, images } = state;

    if (images.length === 0) {
      state.error = 'No images provided.';
      addTraceStep(state, 'Input validation', 'failed', 'No images');
      return state;
    }

    if (inputType === InputType.SINGLE_IMAGE && images.length !== 1) {
      state.error = 'Single image mode requires exactly 1 image.';
      addTraceStep(state, 'Input validation', 'failed', 'Wrong image count');
      return state;
    }

    if ((inputType === InputType.BI_TEMPORAL || inputType === InputType.OPTICAL_SAR) && images.length !== 2) {
      state.error = `${inputType} mode requires exactly 2 images.`;
      addTraceStep(state, 'Input validation', 'failed', 'Wrong image count');
      return state;
    }

    addTraceStep(state, 'Input validated', 'completed', `${images.length} image(s), ${inputType}`);
    return state;
  }

  /**
   * Use the AI provider to synthesize a final response from the tool output.
   * If the tool already produced a good answer, this enhances it.
   */
  private static async synthesizeResponse(state: SatQueryState): Promise<SatQueryState> {
    if (!state.answer) {
      state.answer = 'Analysis completed but no response was generated.';
      state.confidence = 0;
      return state;
    }

    // If the answer came from a specialist model, optionally enhance with the AI provider
    if (state.modelSource === ModelSource.SPECIALIST) {
      try {
        const provider = AIProviderFactory.get();
        if (provider.isConfigured) {
          const synthesisPrompt = `You are a remote-sensing analysis assistant. The user asked: "${state.query}"

A specialist remote-sensing model provided this analysis:
${state.answer}

Please synthesize a clear, professional response. Keep the technical accuracy of the model output but make it readable. Do not add information that the model didn't provide. Be concise.`;

          const synthesized = await provider.generateText(synthesisPrompt);
          state.answer = synthesized;
          addTraceStep(state, 'Response synthesized by AI', 'completed');
        }
      } catch (error) {
        // Keep the raw specialist answer if synthesis fails
        logger.warn('Response synthesis failed, using raw model output');
      }
    }

    return state;
  }

  /**
   * Build a successful analysis result.
   */
  private static buildResult(state: SatQueryState): AnalysisResult {
    return {
      id: `analysis_${Date.now()}`,
      query: state.query,
      inputType: state.inputType,
      detectedTask: state.detectedTask!,
      answer: state.answer || 'No response generated.',
      confidence: state.confidence,
      modelUsed: state.modelUsed || state.selectedModel || 'unknown',
      modelSource: state.modelSource,
      evidence: state.evidence,
      executionTrace: state.executionTrace,
      toolsUsed: state.toolsUsed,
      processingTime: state.processingTime,
      createdAt: new Date(),
    };
  }

  /**
   * Build an error result.
   */
  private static buildErrorResult(state: SatQueryState): AnalysisResult {
    state.processingTime = Date.now() - state.startTime;
    return {
      id: `analysis_${Date.now()}`,
      query: state.query,
      inputType: state.inputType,
      detectedTask: state.detectedTask || ('ERROR' as any),
      answer: state.error || 'An error occurred during analysis.',
      confidence: 0,
      modelUsed: 'none',
      modelSource: ModelSource.FALLBACK,
      evidence: [],
      executionTrace: state.executionTrace,
      toolsUsed: state.toolsUsed,
      processingTime: state.processingTime,
      createdAt: new Date(),
    };
  }
}
