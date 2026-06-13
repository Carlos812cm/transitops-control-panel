import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  createTransitRouteRequest,
  deleteTransitRouteRequest,
  getTransitRoute,
  getTransitRoutes,
  updateTransitRouteRequest,
  updateTransitRouteStatusRequest,
} from './transit-routes.controller.js';
import {
  createTransitRouteSchema,
  getTransitRoutesSchema,
  transitRouteIdParamSchema,
  updateTransitRouteSchema,
  updateTransitRouteStatusSchema,
} from './transit-routes.schemas.js';

export const transitRoutesRouter = Router();

transitRoutesRouter.use(authenticate);

transitRoutesRouter.get('/', validate(getTransitRoutesSchema), asyncHandler(getTransitRoutes));
transitRoutesRouter.get('/:id', validate(transitRouteIdParamSchema), asyncHandler(getTransitRoute));

transitRoutesRouter.post(
  '/',
  authorize(['ADMIN']),
  validate(createTransitRouteSchema),
  asyncHandler(createTransitRouteRequest),
);

transitRoutesRouter.patch(
  '/:id',
  authorize(['ADMIN']),
  validate(updateTransitRouteSchema),
  asyncHandler(updateTransitRouteRequest),
);

transitRoutesRouter.patch(
  '/:id/status',
  authorize(['ADMIN']),
  validate(updateTransitRouteStatusSchema),
  asyncHandler(updateTransitRouteStatusRequest),
);

transitRoutesRouter.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(transitRouteIdParamSchema),
  asyncHandler(deleteTransitRouteRequest),
);
