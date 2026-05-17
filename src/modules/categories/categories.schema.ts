import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

export const CategorySchema = Type.Object({
  id: Type.String({ description: 'Category ULID' }),
  name: Type.String({ description: 'Category name' }),
  slug: Type.String({ description: 'URL-friendly category name' }),
  description: Type.Union([Type.String(), Type.Null()], { description: 'Category description' }),
  createdAt: Type.Any({ description: 'Creation timestamp' }),
  updatedAt: Type.Any({ description: 'Last update timestamp' }),
});

export const GetCategoriesSchema = {
  response: {
    200: createStandardResponseSchema(Type.Array(CategorySchema)),
  },
};

export const GetCategorySchema = {
  params: Type.Object({
    id: Type.String({ description: 'Category ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(CategorySchema),
  },
};

export const CreateCategorySchema = {
  body: Type.Object({
    name: Type.String({ minLength: 1, description: 'Category name' }),
    slug: Type.String({ minLength: 1, description: 'URL-friendly category name' }),
    description: Type.Optional(Type.String({ description: 'Category description' })),
  }),
  response: {
    201: createStandardResponseSchema(CategorySchema),
  },
};

export const UpdateCategorySchema = {
  params: Type.Object({
    id: Type.String({ description: 'Category ULID' }),
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 1, description: 'Category name' })),
    slug: Type.Optional(Type.String({ minLength: 1, description: 'URL-friendly category name' })),
    description: Type.Optional(Type.String({ description: 'Category description' })),
  }),
  response: {
    200: createStandardResponseSchema(CategorySchema),
  },
};

export const DeleteCategorySchema = {
  params: Type.Object({
    id: Type.String({ description: 'Category ULID' }),
  }),
  response: {
    204: Type.Null({ description: 'Category deleted successfully' }),
  },
};

export type CreateCategoryBody = Static<typeof CreateCategorySchema.body>;
export type UpdateCategoryBody = Static<typeof UpdateCategorySchema.body>;
