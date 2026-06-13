import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { driversRouter } from '../modules/drivers/drivers.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { vehiclesRouter } from '../modules/vehicles/vehicles.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/drivers', driversRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/vehicles', vehiclesRouter);
