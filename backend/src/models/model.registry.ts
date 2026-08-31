import axios from 'axios';
import { env } from '../config/env';
import { InputType, TaskType, ModelStatus, RegisteredModel } from '../types';
import { logger } from '../utils/logger';

/**
 * Model Registry — maps tasks to specialist RS models served by the Python ML service.
 * Maintains status tracking and supports runtime model discovery.
 */
class ModelRegistryService {
  private models: Map<string, RegisteredModel> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry() {
    const baseUrl = env.PYTHON_ML_URL;

    const defaultModels: RegisteredModel[] = [
      {
        id: 'rs-vqa',
        name: 'Remote Sensing VQA',
        tasks: [TaskType.VQA],
        modalities: [InputType.SINGLE_IMAGE],
        endpoint: `${baseUrl}/ml/vqa`,
        modelIdentifier: env.VQA_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Visual Question Answering for remote-sensing imagery',
        fallbackProvider: 'vision_ai',
      },
      {
        id: 'rs-caption',
        name: 'Remote Sensing Captioning',
        tasks: [TaskType.CAPTION],
        modalities: [InputType.SINGLE_IMAGE],
        endpoint: `${baseUrl}/ml/caption`,
        modelIdentifier: env.CAPTION_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Scene description and captioning for satellite imagery',
        fallbackProvider: 'vision_ai',
      },
      {
        id: 'rs-grounding',
        name: 'Remote Sensing Grounding',
        tasks: [TaskType.GROUNDING],
        modalities: [InputType.SINGLE_IMAGE],
        endpoint: `${baseUrl}/ml/grounding`,
        modelIdentifier: env.GROUNDING_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Text-guided region grounding in remote-sensing images',
        fallbackProvider: 'vision_ai',
      },
      {
        id: 'change-detection',
        name: 'Change Detection',
        tasks: [TaskType.CHANGE_ANALYSIS],
        modalities: [InputType.BI_TEMPORAL],
        endpoint: `${baseUrl}/ml/change`,
        modelIdentifier: env.CHANGE_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Bi-temporal change analysis for satellite imagery pairs',
        fallbackProvider: 'vision_ai',
      },
      {
        id: 'change-vqa',
        name: 'Change VQA',
        tasks: [TaskType.CHANGE_VQA],
        modalities: [InputType.BI_TEMPORAL],
        endpoint: `${baseUrl}/ml/change-vqa`,
        modelIdentifier: env.CHANGE_VQA_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Visual Question Answering for bi-temporal change imagery',
        fallbackProvider: 'vision_ai',
      },
      {
        id: 'optical-sar-fusion',
        name: 'Optical-SAR Fusion',
        tasks: [TaskType.OPTICAL_SAR_ANALYSIS],
        modalities: [InputType.OPTICAL_SAR],
        endpoint: `${baseUrl}/ml/optical-sar`,
        modelIdentifier: env.OPTICAL_SAR_MODEL_ID || 'not_configured',
        status: ModelStatus.UNAVAILABLE,
        description: 'Cross-modal analysis combining optical and SAR imagery',
        fallbackProvider: 'vision_ai',
      },
    ];

    for (const model of defaultModels) {
      this.models.set(model.id, model);
    }

    logger.info(`Model registry initialized with ${this.models.size} models`);
  }

  /**
   * Probe the Python ML service to check which models are actually available.
   */
  async refreshStatus(): Promise<void> {
    try {
      const resp = await axios.get(`${env.PYTHON_ML_URL}/ml/models`, { timeout: 10000 });
      if (resp.data && resp.data.models) {
        for (const mlModel of resp.data.models) {
          const existing = this.models.get(mlModel.id);
          if (existing) {
            existing.status = mlModel.status === 'loaded' ? ModelStatus.AVAILABLE : ModelStatus.UNAVAILABLE;
            existing.modelIdentifier = mlModel.model_id || existing.modelIdentifier;
          }
        }
        logger.info('Model registry status refreshed from ML service');
      }
    } catch (error) {
      logger.warn('Could not reach ML service for status refresh — all specialist models marked unavailable');
      for (const model of this.models.values()) {
        model.status = ModelStatus.UNAVAILABLE;
      }
    }
  }

  /**
   * Find the best model for a given task and input type.
   */
  findModel(task: TaskType, inputType: InputType): RegisteredModel | null {
    for (const model of this.models.values()) {
      if (model.tasks.includes(task) && model.modalities.includes(inputType)) {
        return model;
      }
    }
    return null;
  }

  /**
   * Get all registered models.
   */
  getAll(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get a specific model by ID.
   */
  get(id: string): RegisteredModel | undefined {
    return this.models.get(id);
  }

  /**
   * Check if a specialist model is available for a task.
   */
  isSpecialistAvailable(task: TaskType, inputType: InputType): boolean {
    const model = this.findModel(task, inputType);
    return model ? model.status === ModelStatus.AVAILABLE : false;
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistryService();
