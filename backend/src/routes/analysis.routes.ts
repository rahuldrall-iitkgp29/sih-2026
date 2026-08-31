import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { validateBody } from '../middleware/validation.middleware';
import { AnalyzeRequestSchema } from '../types';

const router = Router();

// Run analysis
router.post('/', validateBody(AnalyzeRequestSchema), AnalysisController.analyze);

// List analyses
router.get('/', AnalysisController.listAnalyses);

// Get specific analysis
router.get('/:id', AnalysisController.getAnalysis);

// Download report
router.get('/:id/report', AnalysisController.downloadReport);

export default router;
