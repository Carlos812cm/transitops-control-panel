import dotenv from 'dotenv';

dotenv.config();

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer.');
  }

  return port;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: parsePort(process.env['PORT']),
  API_PREFIX: process.env['API_PREFIX'] ?? '/api',
  CLIENT_URL: process.env['CLIENT_URL'] ?? 'http://localhost:4200',
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '1d',
} as const;
