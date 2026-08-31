import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysis.service';
import { ReportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import { logger } from '../utils/logger';

export class AnalysisController {
  /**
   * POST /api/analyze — Run a full analysis.
   */
  static async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AnalysisService.analyze(req.body);
      sendSuccess(res, result, 'Analysis completed successfully');
    } catch (error: any) {
      logger.error('Analysis failed:', error);
      sendError(res, error.message || 'Analysis failed', 500);
    }
  }

  /**
   * GET /api/analyze/:id — Get a previous analysis.
   */
  static async getAnalysis(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const analysis = await AnalysisService.getById(id);
    if (!analysis) {
      sendError(res, 'Analysis not found', 404);
      return;
    }
    sendSuccess(res, analysis);
  }

  /**
   * GET /api/analyze — List recent analyses.
   */
  static async listAnalyses(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 20;
    const analyses = await AnalysisService.list(limit);
    sendSuccess(res, { analyses, count: analyses.length });
  }

  /**
   * GET /api/analyze/:id/report — Download analysis report.
   */
  static async downloadReport(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const analysis = await AnalysisService.getById(id);
    if (!analysis) {
      sendError(res, 'Analysis not found', 404);
      return;
    }

    const report = ReportService.generateReport(analysis);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=satquery-report-${id}.txt`);
    res.send(report);
  }
}
