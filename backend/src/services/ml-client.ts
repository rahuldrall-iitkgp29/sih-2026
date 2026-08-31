import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

export interface MLWorkerResponse {
  success: boolean;
  status: string;
  task: string;
  model: string | null;
  message?: string;
  [key: string]: any;
}

/**
 * Reusable client for communicating with Python ML Workers.
 * Handles timeouts, network failures, GPU errors, and normalizes responses.
 */
export class MLClient {
  /**
   * Send a multipart/form-data request to an ML Worker.
   */
  static async executeTask(
    endpoint: string,
    task: string,
    formData: FormData
  ): Promise<MLWorkerResponse> {
    try {
      const response = await axios.post<MLWorkerResponse>(endpoint, formData, {
        headers: formData.getHeaders(),
        timeout: 240000, // 4 minutes timeout for large models
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, task);
    }
  }

  /**
   * Normalizes errors into the standard MLWorkerResponse format.
   */
  private static handleError(error: any, task: string): MLWorkerResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          success: false,
          task,
          status: 'OFFLINE',
          model: null,
          message: 'ML Worker connection refused. Ensure the Python FastAPI service is running.'
        };
      }
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        return {
          success: false,
          task,
          status: 'TIMEOUT',
          model: null,
          message: 'ML Worker request timed out.'
        };
      }

      if (axiosError.response) {
        // If the python backend actually sent a JSON response but with a 500 status code
        if (axiosError.response.data && typeof axiosError.response.data === 'object') {
            return {
                ...(axiosError.response.data as any),
                success: false,
                task,
                status: (axiosError.response.data as any).status || 'ERROR'
            };
        }
        return {
          success: false,
          task,
          status: 'ERROR',
          model: null,
          message: `ML Worker returned HTTP ${axiosError.response.status}`
        };
      }
    }

    return {
      success: false,
      task,
      status: 'ERROR',
      model: null,
      message: `Unexpected error connecting to ML Worker: ${error.message}`
    };
  }
}
