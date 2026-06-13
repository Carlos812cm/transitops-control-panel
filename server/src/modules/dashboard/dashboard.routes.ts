import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { getDashboardSummaryRequest } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/summary', asyncHandler(getDashboardSummaryRequest));
