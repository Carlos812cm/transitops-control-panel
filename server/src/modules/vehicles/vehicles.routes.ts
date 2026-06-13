import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  createVehicleRequest,
  deleteVehicleRequest,
  getVehicle,
  getVehicles,
  updateVehicleRequest,
  updateVehicleStatusRequest,
} from './vehicles.controller.js';
import {
  createVehicleSchema,
  getVehiclesSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  vehicleIdParamSchema,
} from './vehicles.schemas.js';

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticate);

vehiclesRouter.get('/', validate(getVehiclesSchema), asyncHandler(getVehicles));
vehiclesRouter.get('/:id', validate(vehicleIdParamSchema), asyncHandler(getVehicle));

vehiclesRouter.post(
  '/',
  authorize(['ADMIN']),
  validate(createVehicleSchema),
  asyncHandler(createVehicleRequest),
);

vehiclesRouter.patch(
  '/:id',
  authorize(['ADMIN']),
  validate(updateVehicleSchema),
  asyncHandler(updateVehicleRequest),
);

vehiclesRouter.patch(
  '/:id/status',
  authorize(['ADMIN']),
  validate(updateVehicleStatusSchema),
  asyncHandler(updateVehicleStatusRequest),
);

vehiclesRouter.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(vehicleIdParamSchema),
  asyncHandler(deleteVehicleRequest),
);
