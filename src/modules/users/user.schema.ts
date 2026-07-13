import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

/** Base schema for user object */
export const UserSchema = Type.Object({
  id: Type.String({ description: 'Unique user identifier (ULID)' }),
  email: Type.String({ format: 'email', description: 'User email address' }),
  name: Type.String({ description: 'User full name' }),
  address: Type.Union([Type.String(), Type.Null()], { description: 'User physical address' }),
  phone_number: Type.Union([Type.String(), Type.Null()], { description: 'User contact phone number' }),
  role: Type.String({ description: 'User role (user, admin)' }),
});

/** Schema for listing all users (admin only) */
export const GetUsersSchema = {
  response: {
    200: createStandardResponseSchema(Type.Array(UserSchema)),
  },
};

/** Schema for getting a single user by ID (admin only) */
export const GetUserSchema = {
  params: Type.Object({
    id: Type.String({ description: 'User ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

/** Schema for getting the authenticated user's profile */
export const GetProfileSchema = {
  response: {
    200: createStandardResponseSchema(UserSchema),
  },
};

/** Schema for creating a new user (admin only) */
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

/** Schema for updating a user by ID (admin only) */
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

/** Schema for updating the authenticated user's profile */
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

/** Schema for deleting a user by ID (admin only) */
export const DeleteUserSchema = {
  params: Type.Object({
    id: Type.String({ description: 'User ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      success: Type.Boolean({ description: 'Deletion status' }),
    })),
  },
};

/** TypeScript type for create user request body */
export type CreateUserBody = Static<typeof CreateUserSchema.body>;
/** TypeScript type for update user request body */
export type UpdateUserBody = Static<typeof UpdateUserSchema.body>;
/** TypeScript type for update profile request body */
export type UpdateProfileBody = Static<typeof UpdateProfileSchema.body>;
/** TypeScript type for user object */
export type User = Static<typeof UserSchema>;
