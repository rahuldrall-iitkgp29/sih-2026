import { TaskType, ModelSource } from '../types';
import { modelRegistry } from '../models/model.registry';
import { SatQueryState, addTraceStep } from './state';
import { logger } from '../utils/logger';

// Tool imports
import { executeVQA } from '../tools/vqa.tool';
import { executeCaption } from '../tools/caption.tool';
import { executeGrounding } from '../tools/grounding.tool';
import { executeChange } from '../tools/change.tool';
import { executeChangeVqa } from '../tools/changeVqa.tool';
import { executeOpticalSar } from '../tools/opticalSar.tool';

/**
 * Tool executor function type.
 */
type ToolExecutor = (state: SatQueryState) => Promise<SatQueryState>;

/**
 * Map task types to their tool executors.
 */
const toolMap: Record<TaskType, ToolExecutor> = {
  [TaskType.VQA]: executeVQA,
  [TaskType.CAPTION]: executeCaption,
  [TaskType.GROUNDING]: executeGrounding,
  [TaskType.CHANGE_ANALYSIS]: executeChange,
  [TaskType.CHANGE_VQA]: executeChangeVqa,
  [TaskType.OPTICAL_SAR_ANALYSIS]: executeOpticalSar,
};

/**
 * Route the classified task to the appropriate tool executor.
 * Checks specialist model availability first, falls back to vision AI.
 */
export async function routeToTool(state: SatQueryState): Promise<SatQueryState> {
  if (!state.detectedTask) {
    state.error = 'No task detected. Cannot route to tool.';
    addTraceStep(state, 'Tool routing', 'failed', 'No task detected');
    return state;
  }

  // Check specialist model availability
  const specialistAvailable = modelRegistry.isSpecialistAvailable(state.detectedTask, state.inputType);
  const model = modelRegistry.findModel(state.detectedTask, state.inputType);

  if (specialistAvailable && model) {
    state.selectedModel = model.name;
    state.modelSource = ModelSource.SPECIALIST;
    addTraceStep(state, `${model.name} selected`, 'completed', 'Specialist model available');
    logger.info(`Routing to specialist model: ${model.name}`);
  } else {
    state.modelSource = ModelSource.FALLBACK;
    addTraceStep(state, 'Specialist model unavailable', 'skipped', 'Using fallback vision AI');
    logger.info(`Specialist unavailable for ${state.detectedTask}, using fallback`);
  }

  // Execute the tool
  const executor = toolMap[state.detectedTask];
  if (!executor) {
    state.error = `No tool executor found for task: ${state.detectedTask}`;
    addTraceStep(state, 'Tool execution', 'failed', 'No executor found');
    return state;
  }

  try {
    addTraceStep(state, `${state.detectedTask} tool executing`, 'completed');
    state = await executor(state);
    state.toolsUsed.push(state.selectedTool || state.detectedTask || 'unknown');
    addTraceStep(state, 'Tool execution completed', 'completed');
  } catch (error: any) {
    state.error = `Tool execution failed: ${error.message}`;
    addTraceStep(state, 'Tool execution', 'failed', error.message);
    logger.error(`Tool execution failed for ${state.detectedTask}:`, error);
  }

  return state;
}
