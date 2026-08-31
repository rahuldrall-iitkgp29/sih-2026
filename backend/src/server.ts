import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { ensureUploadDir } from './utils/file.utils';

// Route imports
import healthRoutes from './routes/health.routes';
import uploadRoutes from './routes/upload.routes';
import analysisRoutes from './routes/analysis.routes';
import modelRoutes from './routes/model.routes';

const app = express();

// ─── Middleware ───────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ─── Routes ──────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api/models', modelRoutes);

// ─── Error Handler ───────────────────────────────
app.use(errorMiddleware);

// ─── Start ───────────────────────────────────────
async function start() {
  ensureUploadDir();
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════╗
║           SatQuery AI Backend v1.0            ║
║═══════════════════════════════════════════════║
║  Port:        ${String(env.PORT).padEnd(31)}║
║  AI Provider: ${env.AI_PROVIDER.padEnd(31)}║
║  ML Service:  ${env.PYTHON_ML_URL.padEnd(31)}║
║  Database:    ${env.MONGODB_URI.substring(0, 31).padEnd(31)}║
╚═══════════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
