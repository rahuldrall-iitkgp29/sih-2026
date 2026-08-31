import { z } from 'zod';

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Image Metadata
// ──────────────────────────────────────────────

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
  uploadedAt: Date;
}

// ──────────────────────────────────────────────
// Analysis Request / Response
// ──────────────────────────────────────────────

export const AnalyzeRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000),
  inputType: z.nativeEnum(InputType),
  imageIds: z.array(z.string()).min(1).max(2),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

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
  createdAt: Date;
}

export interface AnalysisEvidence {
  type: 'bounding_box' | 'mask' | 'highlight' | 'comparison' | 'crop' | 'text';
  data: any;
  description: string;
}

export interface ExecutionStep {
  step: number;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  duration?: number;
  detail?: string;
}

// ──────────────────────────────────────────────
// Model Registry Types
// ──────────────────────────────────────────────

export interface RegisteredModel {
  id: string;
  name: string;
  tasks: TaskType[];
  modalities: InputType[];
  endpoint: string;
  modelIdentifier: string;
  status: ModelStatus;
  description: string;
  fallbackProvider: string;
}

// ──────────────────────────────────────────────
// ML Service Response Types
// ──────────────────────────────────────────────

export interface MLServiceResponse {
  success: boolean;
  model: string;
  task: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface VQAResponse extends MLServiceResponse {
  answer: string;
  evidence: any[];
}

export interface CaptionResponse extends MLServiceResponse {
  caption: string;
}

export interface GroundingResponse extends MLServiceResponse {
  boxes: number[][];
  labels: string[];
  confidences: number[];
  mask: string | null;
}

export interface ChangeResponse extends MLServiceResponse {
  changeDetected: boolean;
  description: string;
  changePercentage: number;
  mask: string | null;
}

export interface ChangeVQAResponse extends MLServiceResponse {
  answer: string;
  evidence: any[];
}

export interface OpticalSarResponse extends MLServiceResponse {
  analysis: string;
  regions: any[];
}

// ──────────────────────────────────────────────
// API Response
// ──────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ──────────────────────────────────────────────
// Agent Types
// ──────────────────────────────────────────────

export interface AgentPlan {
  inputType: InputType;
  task: TaskType;
  tool: string;
  reason: string;
}

export interface AgentState {
  query: string;
  inputType: InputType;
  images: ImageMetadata[];
  plan?: AgentPlan;
  result?: AnalysisResult;
  error?: string;
}
