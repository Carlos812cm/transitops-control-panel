import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { getProfile, login } from './auth.controller.js';
import { loginSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), asyncHandler(login));
authRouter.get('/profile', authenticate, asyncHandler(getProfile));
