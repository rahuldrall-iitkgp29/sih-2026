/**
 * Core interfaces for AI providers and remote-sensing models.
 * These abstractions allow swapping providers/models without changing the agent.
 */

import { InputType, TaskType } from '../types';

// ──────────────────────────────────────────────
// AI Provider Interface (for agent reasoning & fallback)
// ──────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  /**
   * Generate a text response from a text prompt.
   * Used for agent reasoning, query interpretation, response synthesis.
   */
  generateText(prompt: string): Promise<string>;

  /**
   * Analyze an image with a text prompt — used as FALLBACK when specialist is unavailable.
   * Returns a text response describing the analysis.
   */
  analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string>;

  /**
   * Analyze two images with a text prompt — used as FALLBACK for bi-temporal / optical-SAR.
   */
  analyzeImages(
    prompt: string,
    images: { base64: string; mimeType: string }[]
  ): Promise<string>;
}

// ──────────────────────────────────────────────
// Remote-Sensing Model Interface (specialist models)
// ──────────────────────────────────────────────

export interface ModelInput {
  images: { base64: string; mimeType: string; path: string }[];
  query?: string;
  parameters?: Record<string, any>;
}

export interface ModelOutput {
  success: boolean;
  model: string;
  task: string;
  confidence: number;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface RemoteSensingModelSpec {
  id: string;
  name: string;
  tasks: TaskType[];
  modalities: InputType[];
  endpoint: string;
  modelIdentifier: string;
  description: string;
}
