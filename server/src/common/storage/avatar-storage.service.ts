import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { fileTypeFromBuffer } from 'file-type';

import { AppError } from '../errors/app-error.js';
import { avatarsDirectory, avatarsPublicPath } from '../../config/uploads.config.js';

const allowedAvatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function saveAvatarFile(userId: string, fileBuffer: Buffer): Promise<string> {
  if (fileBuffer.length === 0) {
    throw new AppError('Avatar file cannot be empty.', 400, {
      avatar: ['Avatar file cannot be empty.'],
    });
  }

  const detectedFileType = await fileTypeFromBuffer(fileBuffer);

  if (!detectedFileType || !allowedAvatarMimeTypes.has(detectedFileType.mime)) {
    throw new AppError('Avatar must be a JPEG, PNG, or WebP image.', 400, {
      avatar: ['Avatar must be a JPEG, PNG, or WebP image.'],
    });
  }

  await mkdir(avatarsDirectory, {
    recursive: true,
  });

  const filename = `${userId}-${randomUUID()}.${detectedFileType.ext}`;

  const filePath = path.join(avatarsDirectory, filename);

  await writeFile(filePath, fileBuffer, {
    flag: 'wx',
  });

  return `${avatarsPublicPath}/${filename}`;
}

export async function deleteAvatarFile(avatarUrl: string | null | undefined): Promise<void> {
  if (!avatarUrl) {
    return;
  }

  const expectedPrefix = `${avatarsPublicPath}/`;

  if (!avatarUrl.startsWith(expectedPrefix)) {
    return;
  }

  const filename = avatarUrl.slice(expectedPrefix.length);

  if (
    !filename ||
    filename.includes('/') ||
    filename.includes('\\') ||
    path.basename(filename) !== filename
  ) {
    return;
  }

  const filePath = path.join(avatarsDirectory, filename);

  try {
    await unlink(filePath);
  } catch (error) {
    const fileSystemError = error as NodeJS.ErrnoException;

    if (fileSystemError.code !== 'ENOENT') {
      throw error;
    }
  }
}
