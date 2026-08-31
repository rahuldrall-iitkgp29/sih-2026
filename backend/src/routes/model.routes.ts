import { Router, Request, Response } from 'express';
import { modelRegistry } from '../models/model.registry';
import { sendSuccess } from '../utils/response.utils';

const router = Router();

/**
 * GET /api/models — List all registered models with their status.
 */
router.get('/', async (_req: Request, res: Response) => {
  // Refresh status from ML service
  await modelRegistry.refreshStatus();

  const models = modelRegistry.getAll().map((m) => ({
    id: m.id,
    name: m.name,
    tasks: m.tasks,
    modalities: m.modalities,
    modelIdentifier: m.modelIdentifier,
    status: m.status,
    description: m.description,
    fallbackAvailable: m.fallbackProvider === 'vision_ai',
  }));

  sendSuccess(res, { models, count: models.length });
});

/**
 * GET /api/models/:id — Get a specific model.
 */
router.get('/:id', (req: Request, res: Response) => {
  const model = modelRegistry.get(req.params.id as string);
  if (!model) {
    res.status(404).json({ success: false, error: 'Model not found' });
    return;
  }
  sendSuccess(res, model);
});

export default router;
