import { Router } from 'express';

import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import {
  approveUserRequest,
  getUser,
  getUsers,
  rejectUserRequest,
  updateUserStatusRequest,
} from './users.controller.js';
import {
  getUsersSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from './users.schemas.js';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.use(authorize(['ADMIN']));

usersRouter.get('/', validate(getUsersSchema), asyncHandler(getUsers));
usersRouter.get('/:id', validate(userIdParamSchema), asyncHandler(getUser));
usersRouter.patch('/:id/approve', validate(userIdParamSchema), asyncHandler(approveUserRequest));
usersRouter.patch('/:id/reject', validate(userIdParamSchema), asyncHandler(rejectUserRequest));
usersRouter.patch(
  '/:id/status',
  validate(updateUserStatusSchema),
  asyncHandler(updateUserStatusRequest),
);
