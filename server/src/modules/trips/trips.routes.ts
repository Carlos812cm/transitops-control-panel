import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  createTripRequest,
  deleteTripRequest,
  getTrip,
  getTrips,
  updateTripStatusRequest,
} from './trips.controller.js';
import {
  createTripSchema,
  getTripsSchema,
  tripIdParamSchema,
  updateTripStatusSchema,
} from './trips.schemas.js';

export const tripsRouter = Router();

tripsRouter.use(authenticate);

tripsRouter.get('/', validate(getTripsSchema), asyncHandler(getTrips));
tripsRouter.get('/:id', validate(tripIdParamSchema), asyncHandler(getTrip));

tripsRouter.post(
  '/',
  authorize(['ADMIN', 'OPERATOR', 'SUPERVISOR']),
  validate(createTripSchema),
  asyncHandler(createTripRequest),
);

tripsRouter.patch(
  '/:id/status',
  authorize(['ADMIN', 'OPERATOR', 'SUPERVISOR']),
  validate(updateTripStatusSchema),
  asyncHandler(updateTripStatusRequest),
);

tripsRouter.delete(
  '/:id',
  authorize(['ADMIN']),
  validate(tripIdParamSchema),
  asyncHandler(deleteTripRequest),
);
