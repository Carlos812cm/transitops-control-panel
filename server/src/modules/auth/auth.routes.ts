import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  changePassword,
  deleteAvatar,
  getProfile,
  login,
  updateAvatar,
  updateProfile,
} from './auth.controller.js';
import { changePasswordSchema, loginSchema, updateProfileSchema } from './auth.schemas.js';
import { uploadSingleAvatar } from '../../common/middlewares/avatar-upload.middleware.js';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), asyncHandler(login));

authRouter.get('/profile', authenticate, asyncHandler(getProfile));

authRouter.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(updateProfile),
);

authRouter.patch(
  '/profile/password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(changePassword),
);

authRouter.patch('/profile/avatar', authenticate, uploadSingleAvatar, asyncHandler(updateAvatar));

authRouter.delete('/profile/avatar', authenticate, asyncHandler(deleteAvatar));
