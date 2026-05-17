import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';
import { UserSchema } from '../users/user.schema.js';

export const RegisterSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email', description: 'User email address' }),
    password: Type.String({ minLength: 8, description: 'User password (min 8 characters)' }),
    name: Type.String({ minLength: 1, description: 'User full name' }),
    address: Type.Optional(Type.String({ description: 'User physical address' })),
    phoneNumber: Type.Optional(Type.String({ description: 'User contact phone number' })),
    role: Type.Optional(Type.Union([Type.Literal('user'), Type.Literal('admin')], { description: 'User role' })),
  }),
  response: {
    201: createStandardResponseSchema(UserSchema),
  },
};

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

export const ChangePasswordSchema = {
  body: Type.Object({
    oldPassword: Type.String({ description: 'Current password' }),
    newPassword: Type.String({ minLength: 8, description: 'New password (min 8 characters)' }),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

export const RefreshTokenSchema = {
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

export const LogoutSchema = {
  response: {
    200: createStandardResponseSchema(Type.Object({
      status: Type.String({ description: 'Operation status' }),
    })),
  },
};

export type RegisterBody = Static<typeof RegisterSchema.body>;
export type LoginBody = Static<typeof LoginSchema.body>;
export type ChangePasswordBody = Static<typeof ChangePasswordSchema.body>;
