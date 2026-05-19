import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

export const UserSchema = Type.Object({
  id: Type.String({ description: 'Unique user identifier (ULID)' }),
  email: Type.String({ format: 'email', description: 'User email address' }),
  name: Type.String({ description: 'User full name' }),
  address: Type.Union([Type.String(), Type.Null()], { description: 'User physical address' }),
  phone_number: Type.Union([Type.String(), Type.Null()], { description: 'User contact phone number' }),
  role: Type.String({ description: 'User role (user, admin)' }),
});

export const GetUsersSchema = {
  response: {
    200: createStandardResponseSchema(Type.Array(UserSchema)),
  },
};

export const GetUserSchema = {
  params: Type.Object({
    id: Type.String({ description: 'User ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

export const GetProfileSchema = {
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

export const CreateUserSchema = {
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

export const UpdateUserSchema = {
  params: Type.Object({
    id: Type.String({ description: 'User ULID' }),
  }),
  body: Type.Object({
    email: Type.Optional(Type.String({ format: 'email', description: 'User email address' })),
    password: Type.Optional(Type.String({ minLength: 8, description: 'User password (min 8 characters)' })),
    name: Type.Optional(Type.String({ minLength: 1, description: 'User full name' })),
    address: Type.Optional(Type.String({ description: 'User physical address' })),
    phone_number: Type.Optional(Type.String({ description: 'User contact phone number' })),
    role: Type.Optional(Type.Union([Type.Literal('user'), Type.Literal('admin')], { description: 'User role' })),
  }),
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

export const UpdateProfileSchema = {
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 1, description: 'User full name' })),
    address: Type.Optional(Type.String({ description: 'User physical address' })),
    phone_number: Type.Optional(Type.String({ description: 'User contact phone number' })),
  }),
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

export const DeleteUserSchema = {
  params: Type.Object({
    id: Type.String({ description: 'User ULID' }),
  }),
  response: {
    204: Type.Null({ description: 'User deleted successfully' }),
  },
};

export type CreateUserBody = Static<typeof CreateUserSchema.body>;
export type UpdateUserBody = Static<typeof UpdateUserSchema.body>;
export type UpdateProfileBody = Static<typeof UpdateProfileSchema.body>;
export type User = Static<typeof UserSchema>;
