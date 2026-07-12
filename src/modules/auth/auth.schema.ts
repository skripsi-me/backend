import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';
import { UserSchema } from '../users/user.schema.js';

/** Schema for user registration request body */
export const RegisterSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({ minLength: 8, description: 'User password (min 8 characters)' }),
    name: Type.String({ minLength: 1, description: 'User full name' }),
    address: Type.Optional(Type.String({ description: 'User physical address' })),
    phone_number: Type.Optional(Type.String({ description: 'User contact phone number' })),
    role: Type.Optional(Type.Union([Type.Literal('user'), Type.Literal('admin')], { description: 'User role' })),
  }),
  response: {
    201: createStandardResponseSchema(UserSchema),
  },
};

/** Schema for user login request body */
export const LoginSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({ description: 'User password' }),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

/** Schema for change password request body */
export const ChangePasswordSchema = {
  body: Type.Object({
    old_password: Type.String({ description: 'Current password' }),
    new_password: Type.String({ minLength: 8, description: 'New password (min 8 characters)' }),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

/** Schema for token refresh response (no body required) */
export const RefreshTokenSchema = {
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

/** Schema for logout response (clears cookies) */
export const LogoutSchema = {
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

/** TypeScript type for register request body */
export type RegisterBody = Static<typeof RegisterSchema.body>;
/** TypeScript type for login request body */
export type LoginBody = Static<typeof LoginSchema.body>;
/** TypeScript type for change password request body */
export type ChangePasswordBody = Static<typeof ChangePasswordSchema.body>;
