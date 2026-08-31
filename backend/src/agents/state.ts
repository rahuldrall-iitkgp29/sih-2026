import { InputType, TaskType, ImageMetadata, ExecutionStep, AnalysisEvidence, ModelSource } from '../types';

/**
 * State that flows through the agent pipeline.
 */
export interface SatQueryState {
  // Input
  query: string;
  inputType: InputType;
  images: ImageMetadata[];

  // Planning
  detectedTask: TaskType | null;
  selectedTool: string | null;
  selectedModel: string | null;
  planReason: string | null;

  // Execution
  answer: string | null;
  confidence: number;
  modelUsed: string | null;
  modelSource: ModelSource;
  evidence: AnalysisEvidence[];
  toolsUsed: string[];
  executionTrace: ExecutionStep[];

  // Timing
  startTime: number;
  processingTime: number;

  // Error
  error: string | null;
}

/**
 * Create an initial agent state.
 */
export function createInitialState(
  query: string,
  inputType: InputType,
  images: ImageMetadata[]
): SatQueryState {
  return {
    query,
    inputType,
    images,
    detectedTask: null,
    selectedTool: null,
    selectedModel: null,
    planReason: null,
    answer: null,
    confidence: 0,
    modelUsed: null,
    modelSource: ModelSource.FALLBACK,
    evidence: [],
    toolsUsed: [],
    executionTrace: [],
    startTime: Date.now(),
    processingTime: 0,
    error: null,
  };
}

/**
 * Add a step to the execution trace.
 */
export function addTraceStep(
  state: SatQueryState,
  name: string,
  status: 'completed' | 'failed' | 'skipped',
  detail?: string
): void {
  const step: ExecutionStep = {
    step: state.executionTrace.length + 1,
    name,
    status,
    duration: Date.now() - state.startTime,
    detail,
  };
  state.executionTrace.push(step);
}
