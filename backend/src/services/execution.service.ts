import { ExecutionStep } from '../types';
import { logger } from '../utils/logger';

/**
 * Execution tracking service — records timing and steps.
 */
export class ExecutionService {
  private startTime: number;
  private steps: ExecutionStep[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  addStep(name: string, status: 'completed' | 'failed' | 'skipped', detail?: string): void {
    this.steps.push({
      step: this.steps.length + 1,
      name,
      status,
      duration: Date.now() - this.startTime,
      detail,
    });
    logger.debug(`Execution step: ${name} (${status})`);
  }

  getSteps(): ExecutionStep[] {
    return this.steps;
  }

  getElapsedMs(): number {
    return Date.now() - this.startTime;
  }
}
