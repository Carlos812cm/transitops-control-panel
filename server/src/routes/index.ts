import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { driversRouter } from '../modules/drivers/drivers.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { transitRoutesRouter } from '../modules/transit-routes/transit-routes.routes.js';
import { tripsRouter } from '../modules/trips/trips.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { vehiclesRouter } from '../modules/vehicles/vehicles.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/drivers', driversRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/routes', transitRoutesRouter);
apiRouter.use('/trips', tripsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/vehicles', vehiclesRouter);
