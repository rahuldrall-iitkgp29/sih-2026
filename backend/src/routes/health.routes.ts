import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { env } from '../config/env';
import { sendSuccess } from '../utils/response.utils';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let mlServiceStatus = 'unavailable';
  try {
    const resp = await axios.get(`${env.PYTHON_ML_URL}/health`, { timeout: 5000 });
    if (resp.status === 200) mlServiceStatus = 'connected';
  } catch {
    mlServiceStatus = 'unavailable';
  }

  sendSuccess(res, {
    status: 'ok',
    service: 'SatQuery AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbStatus,
      mlService: mlServiceStatus,
      aiProvider: env.AI_API_KEY ? env.AI_PROVIDER : 'not configured',
    },
  });
});

export default router;
