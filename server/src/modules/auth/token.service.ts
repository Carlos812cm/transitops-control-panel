import jwt, { SignOptions } from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { JwtPayload } from './auth.types.js';

export function signAuthToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

