import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

// Validate required variables
const JWT_SECRET = requireEnv('JWT_SECRET');
const COOKIE_SECRET = requireEnv('COOKIE_SECRET');
const IMAGEKIT_PUBLIC_KEY = requireEnv('IMAGEKIT_PUBLIC_KEY');
const IMAGEKIT_PRIVATE_KEY = requireEnv('IMAGEKIT_PRIVATE_KEY');
const IMAGEKIT_URL_ENDPOINT = requireEnv('IMAGEKIT_URL_ENDPOINT');

// Database: individual environment variables
const DATABASE_HOST = requireEnv('DATABASE_HOST');
const DATABASE_PORT = optionalEnv('DATABASE_PORT', '3306');
const DATABASE_USER = requireEnv('DATABASE_USER');
const DATABASE_PASSWORD = optionalEnv('DATABASE_PASSWORD', '');
const DATABASE_NAME = requireEnv('DATABASE_NAME');

export const env = {
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  PORT: Number(optionalEnv('PORT', '3000')),
  HOST: optionalEnv('HOST', '0.0.0.0'),
  DATABASE_HOST,
  DATABASE_PORT: Number(DATABASE_PORT),
  DATABASE_USER,
  DATABASE_PASSWORD,
  DATABASE_NAME,
  JWT_SECRET,
  COOKIE_SECRET,
  IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT,
};
