import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRootDirectory = fileURLToPath(new URL('../../', import.meta.url));

const configuredUploadsDirectory = process.env['UPLOADS_DIR']?.trim();

export const uploadsDirectory = configuredUploadsDirectory
  ? path.resolve(configuredUploadsDirectory)
  : path.join(serverRootDirectory, 'uploads');

export const avatarsDirectory = path.join(uploadsDirectory, 'avatars');

export const avatarsPublicPath = '/uploads/avatars';

export const avatarMaxFileSizeBytes = 2 * 1024 * 1024;
