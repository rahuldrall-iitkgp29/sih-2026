import { InputType, TaskType } from '../types';
import { AIProviderFactory } from '../models/llm.provider';
import { SatQueryState, addTraceStep } from './state';
import { logger } from '../utils/logger';

/**
 * Task classification prompts for the agent.
 */
const CLASSIFICATION_PROMPT = `You are a remote-sensing image analysis task classifier.

Given a user query and input type, classify the task into exactly ONE of these categories:
- VQA: Visual question answering about a single image
- CAPTION: Scene description or captioning of a single image
- GROUNDING: Locating specific objects or regions in a single image
- CHANGE_ANALYSIS: Detecting and describing changes between two temporal images
- CHANGE_VQA: Answering questions about changes between two temporal images
- OPTICAL_SAR_ANALYSIS: Cross-modal analysis using optical and SAR image pair

Input type is: {inputType}
User query: {query}

Respond with ONLY a JSON object (no markdown, no code fences):
{"task": "TASK_TYPE", "tool": "tool_name", "reason": "brief reason"}

Tool name mapping:
- VQA -> remote_sensing_vqa
- CAPTION -> image_captioning
- GROUNDING -> region_grounding
- CHANGE_ANALYSIS -> change_analysis
- CHANGE_VQA -> change_vqa
- OPTICAL_SAR_ANALYSIS -> optical_sar_analysis`;

/**
 * Classify the user's query into a task type using the AI provider.
 */
export async function classifyTask(state: SatQueryState): Promise<SatQueryState> {
  const provider = AIProviderFactory.get();

  // If the provider isn't configured, use heuristic classification
  if (!provider.isConfigured) {
    logger.info('AI provider not configured, using heuristic classification');
    return heuristicClassify(state);
  }

  try {
    const prompt = CLASSIFICATION_PROMPT
      .replace('{inputType}', state.inputType)
      .replace('{query}', state.query);

    const response = await provider.generateText(prompt);

    // Parse the JSON response
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    state.detectedTask = parsed.task as TaskType;
    state.selectedTool = parsed.tool;
    state.planReason = parsed.reason;

    addTraceStep(state, 'Query classified', 'completed', `Task: ${state.detectedTask}`);
    logger.info(`Task classified: ${state.detectedTask} (tool: ${state.selectedTool})`);
  } catch (error) {
    logger.warn(`AI classification failed, falling back to heuristic: ${error}`);
    return heuristicClassify(state);
  }

  return state;
}

/**
 * Heuristic-based task classification when AI provider is unavailable.
 */
function heuristicClassify(state: SatQueryState): SatQueryState {
  const query = state.query.toLowerCase();
  const { inputType } = state;

  if (inputType === InputType.OPTICAL_SAR) {
    state.detectedTask = TaskType.OPTICAL_SAR_ANALYSIS;
    state.selectedTool = 'optical_sar_analysis';
    state.planReason = 'Optical+SAR pair detected';
  } else if (inputType === InputType.BI_TEMPORAL) {
    // Check if it's a question about changes or general change analysis
    if (query.includes('?') || query.includes('what') || query.includes('how') ||
        query.includes('has') || query.includes('did') || query.includes('is there')) {
      state.detectedTask = TaskType.CHANGE_VQA;
      state.selectedTool = 'change_vqa';
      state.planReason = 'Bi-temporal pair with question detected';
    } else {
      state.detectedTask = TaskType.CHANGE_ANALYSIS;
      state.selectedTool = 'change_analysis';
      state.planReason = 'Bi-temporal pair detected';
    }
  } else {
    // Single image tasks
    if (query.includes('describe') || query.includes('caption') || query.includes('scene') ||
        query.includes('summary') || query.includes('overview')) {
      state.detectedTask = TaskType.CAPTION;
      state.selectedTool = 'image_captioning';
      state.planReason = 'Description/caption request detected';
    } else if (query.includes('where') || query.includes('locate') || query.includes('find') ||
               query.includes('region') || query.includes('area') || query.includes('bounding')) {
      state.detectedTask = TaskType.GROUNDING;
      state.selectedTool = 'region_grounding';
      state.planReason = 'Spatial grounding query detected';
    } else {
      state.detectedTask = TaskType.VQA;
      state.selectedTool = 'remote_sensing_vqa';
      state.planReason = 'Visual question answering query detected';
    }
  }

  addTraceStep(state, 'Query classified (heuristic)', 'completed', `Task: ${state.detectedTask}`);
  logger.info(`Heuristic classification: ${state.detectedTask}`);
  return state;
}
