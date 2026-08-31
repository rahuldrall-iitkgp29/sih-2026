import axios from 'axios';
import { env } from '../config/env';
import { InputType, TaskType, ModelStatus, RegisteredModel } from '../types';
import { logger } from '../utils/logger';

/**
 * Model Registry — maps tasks to specialist RS models served by the Python ML service.
 * Maintains status tracking and supports runtime model discovery across multiple ML Workers.
 */
class ModelRegistryService {
  private models: Map<string, RegisteredModel> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry() {
    const defaultModels: RegisteredModel[] = [
      {
        id: 'rs-vqa',
        name: 'Remote Sensing VQA',
        tasks: [TaskType.VQA],
        modalities: [InputType.SINGLE_IMAGE],
        endpoint: `${env.VQA_ML_URL || env.PYTHON_ML_URL}/ml/vqa`,
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
        endpoint: `${env.CAPTION_ML_URL || env.PYTHON_ML_URL}/ml/caption`,
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
        endpoint: `${env.GROUNDING_ML_URL || env.PYTHON_ML_URL}/ml/grounding`,
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
        endpoint: `${env.CHANGE_ML_URL || env.PYTHON_ML_URL}/ml/change`,
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
        endpoint: `${env.CHANGE_VQA_ML_URL || env.PYTHON_ML_URL}/ml/change-vqa`,
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
        endpoint: `${env.OPTICAL_SAR_ML_URL || env.PYTHON_ML_URL}/ml/optical-sar`,
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
   * Probe all unique ML Workers to check which models are actually available.
   */
  async refreshStatus(): Promise<void> {
    // Get unique base URLs
    const uniqueBaseUrls = new Set<string>();
    for (const model of this.models.values()) {
        const urlObj = new URL(model.endpoint);
        uniqueBaseUrls.add(`${urlObj.protocol}//${urlObj.host}`);
    }

    for (const baseUrl of uniqueBaseUrls) {
        try {
            const resp = await axios.get(`${baseUrl}/ml/models`, { timeout: 10000 });
            if (resp.data && resp.data.models) {
                for (const mlModel of resp.data.models) {
                    const existing = this.models.get(mlModel.id);
                    if (existing) {
                        existing.status = mlModel.status === 'READY' ? ModelStatus.AVAILABLE : ModelStatus.UNAVAILABLE;
                        existing.modelIdentifier = mlModel.model_id || existing.modelIdentifier;
                    }
                }
            }
        } catch (error) {
            logger.warn(`Could not reach ML service at ${baseUrl} for status refresh`);
        }
    }
  }

  findModel(task: TaskType, inputType: InputType): RegisteredModel | null {
    for (const model of this.models.values()) {
      if (model.tasks.includes(task) && model.modalities.includes(inputType)) {
        return model;
      }
    }
    return null;
  }

  getAll(): RegisteredModel[] {
    return Array.from(this.models.values());
  }

  get(id: string): RegisteredModel | undefined {
    return this.models.get(id);
  }

  isSpecialistAvailable(task: TaskType, inputType: InputType): boolean {
    const model = this.findModel(task, inputType);
    return model ? model.status === ModelStatus.AVAILABLE : false;
  }
}

export const modelRegistry = new ModelRegistryService();
