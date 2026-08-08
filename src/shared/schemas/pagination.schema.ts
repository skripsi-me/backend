import { Type } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../utils/response.util.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 1000;

/** Shared pagination query params */
export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT, description: 'Items per page' })),
});

/** Pagination meta in response */
export const PaginationMetaSchema = Type.Object({
  total: Type.Number({ description: 'Total number of items' }),
  page: Type.Number({ description: 'Current page number' }),
  limit: Type.Number({ description: 'Items per page' }),
  total_pages: Type.Number({ description: 'Total number of pages' }),
});

/** Helper to create paginated response schema for any data type */
export function createPaginatedResponseSchema<T extends ReturnType<typeof Type.Object>>(dataSchema: T) {
  return createStandardResponseSchema(
    Type.Object({
      data: Type.Array(dataSchema),
      meta: PaginationMetaSchema,
    })
  );
}
