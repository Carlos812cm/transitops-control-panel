import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { avatarMaxFileSizeBytes } from '../../config/uploads.config.js';
import { AppError } from '../errors/app-error.js';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: avatarMaxFileSizeBytes,
    files: 1,
  },
});

export function uploadSingleAvatar(request: Request, response: Response, next: NextFunction): void {
  avatarUpload.single('avatar')(request, response, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new AppError('Avatar file must not exceed 2 MB.', 413, {
            avatar: ['Avatar file must not exceed 2 MB.'],
          }),
        );
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(
          new AppError('Only one file using the avatar field is allowed.', 400, {
            avatar: ['Only one file using the avatar field is allowed.'],
          }),
        );
        return;
      }

      next(
        new AppError('Avatar upload failed.', 400, {
          avatar: [`Avatar upload failed: ${error.code}.`],
        }),
      );
      return;
    }

    next(error);
  });
}
