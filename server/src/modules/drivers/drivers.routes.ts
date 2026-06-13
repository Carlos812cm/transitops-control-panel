import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  createDriverRequest,
  deleteDriverRequest,
  getDriver,
  getDrivers,
  updateDriverRequest,
  updateDriverStatusRequest,
} from './drivers.controller.js';
import {
  createDriverSchema,
  driverIdParamSchema,
  getDriversSchema,
  updateDriverSchema,
  updateDriverStatusSchema,
} from './drivers.schemas.js';

export const driversRouter = Router();

driversRouter.use(authenticate);

driversRouter.get('/', validate(getDriversSchema), asyncHandler(getDrivers));
driversRouter.get('/:id', validate(driverIdParamSchema), asyncHandler(getDriver));

driversRouter.post(
  '/',
  authorize(['ADMIN']),
  validate(createDriverSchema),
  asyncHandler(createDriverRequest),
);

driversRouter.patch(
  '/:id',
  authorize(['ADMIN']),
  validate(updateDriverSchema),
  asyncHandler(updateDriverRequest),
);

driversRouter.patch(
  '/:id/status',
  authorize(['ADMIN']),
  validate(updateDriverStatusSchema),
  asyncHandler(updateDriverStatusRequest),
);

driversRouter.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(driverIdParamSchema),
  asyncHandler(deleteDriverRequest),
);
