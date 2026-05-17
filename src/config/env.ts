import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import 'dotenv/config';

const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ], { default: 'development' }),
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  DATABASE_HOST: Type.String(),
  DATABASE_PORT: Type.Number({ default: 3306 }),
  DATABASE_USER: Type.String(),
  DATABASE_PASSWORD: Type.String(),
  DATABASE_NAME: Type.String(),
  JWT_SECRET: Type.String(),
  COOKIE_SECRET: Type.String(),
  IMAGEKIT_PUBLIC_KEY: Type.String(),
  IMAGEKIT_PRIVATE_KEY: Type.String(),
  IMAGEKIT_URL_ENDPOINT: Type.String(),
});

type Env = Static<typeof EnvSchema>;

const _env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
  HOST: process.env.HOST,
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_PORT: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
  DATABASE_USER: process.env.DATABASE_USER,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  DATABASE_NAME: process.env.DATABASE_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
};

// Validate environment variables
if (!Value.Check(EnvSchema, _env)) {
  const errors = [...Value.Errors(EnvSchema, _env)];
  console.error('❌ Invalid environment variables:');
  errors.forEach((error) => {
    console.error(`  - ${error.path}: ${error.message}`);
  });
  process.exit(1);
}

export const env = _env as Env;
