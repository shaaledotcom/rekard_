import { Router, Request, Response } from 'express';
import type { HealthResponse, ApiResponse } from '../shared/types/index.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response<ApiResponse<HealthResponse>>): void => {
  const health: HealthResponse = {
    status: 'healthy',
    service: 'rekard-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: health,
  });
});

// Readiness check
router.get('/ready', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Service is ready',
  });
});

export const healthRoutes: Router = router;

