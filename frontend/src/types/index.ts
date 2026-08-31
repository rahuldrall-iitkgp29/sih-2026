export enum InputType {
  SINGLE_IMAGE = 'SINGLE_IMAGE',
  BI_TEMPORAL = 'BI_TEMPORAL',
  OPTICAL_SAR = 'OPTICAL_SAR',
}

export enum TaskType {
  VQA = 'VQA',
  CAPTION = 'CAPTION',
  GROUNDING = 'GROUNDING',
  CHANGE_ANALYSIS = 'CHANGE_ANALYSIS',
  CHANGE_VQA = 'CHANGE_VQA',
  OPTICAL_SAR_ANALYSIS = 'OPTICAL_SAR_ANALYSIS',
}

export enum ModelStatus {
  AVAILABLE = 'available',
  LOADING = 'loading',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

export enum ModelSource {
  SPECIALIST = 'specialist',
  FALLBACK = 'fallback',
}

export interface ImageMetadata {
  id: string;
  filename: string;
  originalName: string;
  format: string;
  mimetype: string;
  size: number;
  width: number | null;
  height: number | null;
  bands: number | null;
  crs: string | null;
  bbox: number[] | null;
  sensor: string | null;
  path: string;
  previewUrl?: string;
}

export interface ExecutionStep {
  step: number;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  duration?: number;
  detail?: string;
}

export interface AnalysisEvidence {
  type: 'bounding_box' | 'mask' | 'highlight' | 'comparison' | 'crop' | 'text';
  data: any;
  description: string;
}

export interface AnalysisResult {
  id: string;
  query: string;
  inputType: InputType;
  detectedTask: TaskType;
  answer: string;
  confidence: number;
  modelUsed: string;
  modelSource: ModelSource;
  evidence: AnalysisEvidence[];
  executionTrace: ExecutionStep[];
  toolsUsed: string[];
  processingTime: number;
  createdAt: string;
}

export interface RegisteredModel {
  id: string;
  name: string;
  tasks: TaskType[];
  modalities: InputType[];
  modelIdentifier: string;
  status: ModelStatus;
  description: string;
  fallbackAvailable: boolean;
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  inputType: InputType;
  query: string;
  description: string;
  expectedTask: string;
  images: {
    name: string;
    url: string;
    label?: string;
  }[];
}
