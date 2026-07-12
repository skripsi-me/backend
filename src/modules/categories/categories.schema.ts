import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

/** Base schema for category object */
export const CategorySchema = Type.Object({
  id: Type.String({ description: 'Category ULID' }),
  name: Type.String({ description: 'Category name' }),
  slug: Type.String({ description: 'URL-friendly category name' }),
  description: Type.Union([Type.String(), Type.Null()], { description: 'Category description' }),
  created_at: Type.Any({ description: 'Creation timestamp' }),
  updated_at: Type.Any({ description: 'Last update timestamp' }),
});

/** Schema for listing all categories */
export const GetCategoriesSchema = {
  response: {
    200: createStandardResponseSchema(Type.Array(CategorySchema)),
  },
};

/** Schema for getting a single category by ID (admin only) */
export const GetCategorySchema = {
  params: Type.Object({
    id: Type.String({ description: 'Category ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(CategorySchema),
  },
};

/** Schema for creating a new category (admin only) */
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

/** Schema for updating a category by ID (admin only) */
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

/** Schema for deleting a category by ID (admin only) */
export const DeleteCategorySchema = {
  params: Type.Object({
    id: Type.String({ description: 'Category ULID' }),
  }),
  response: {
    204: Type.Null({ description: 'Category deleted successfully' }),
  },
};

/** TypeScript type for create category request body */
export type CreateCategoryBody = Static<typeof CreateCategorySchema.body>;
/** TypeScript type for update category request body */
export type UpdateCategoryBody = Static<typeof UpdateCategorySchema.body>;
