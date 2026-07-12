import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

/** Base schema for product object */
export const ProductSchema = Type.Object({
  id: Type.String({ description: 'Product ULID' }),
  category_id: Type.Union([Type.String(), Type.Null()], { description: 'Category ULID' }),
  name: Type.String({ description: 'Product name' }),
  slug: Type.String({ description: 'URL-friendly product name' }),
  description: Type.Union([Type.String(), Type.Null()], { description: 'Product description' }),
  price: Type.String({ description: 'Product price (decimal string)' }),
  stock: Type.Number({ description: 'Available stock quantity' }),
  image_url: Type.Union([Type.String(), Type.Null()], { description: 'Product image URL' }),
  created_at: Type.Any({ description: 'Creation timestamp' }),
  updated_at: Type.Any({ description: 'Last update timestamp' }),
});

/** Schema for listing products with pagination, search, and category filter */
export const ListProductsSchema = {
  query: Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10, description: 'Items per page' })),
    search: Type.Optional(Type.String({ description: 'Search term for name or description' })),
    category_id: Type.Optional(Type.String({ description: 'Filter by category ULID' })),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      data: Type.Array(ProductSchema),
      meta: Type.Object({
        total: Type.Number({ description: 'Total number of items' }),
        page: Type.Number({ description: 'Current page number' }),
        limit: Type.Number({ description: 'Items per page' }),
        total_pages: Type.Number({ description: 'Total number of pages' }),
      }),
    })),
  },
};

/** Schema for getting a single product by ID (admin only) */
export const GetProductSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Product ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(ProductSchema),
  },
};

/** Schema for getting a single product by slug (public) */
export const GetProductBySlugSchema = {
  params: Type.Object({
    slug: Type.String({ description: 'Product slug' }),
  }),
  response: {
    200: createStandardResponseSchema(ProductSchema),
  },
};

/** Schema for listing products by category slug with pagination */
export const ListProductsByCategorySchema = {
  params: Type.Object({
    category_slug: Type.String({ description: 'Category slug' }),
  }),
  query: Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10, description: 'Items per page' })),
  }),
  response: {
    200: createStandardResponseSchema(Type.Object({
      data: Type.Array(ProductSchema),
      meta: Type.Object({
        total: Type.Number({ description: 'Total number of items' }),
        page: Type.Number({ description: 'Current page number' }),
        limit: Type.Number({ description: 'Items per page' }),
        total_pages: Type.Number({ description: 'Total number of pages' }),
      }),
    })),
  },
};

/** Schema for creating a new product (admin only, multipart/form-data) */
export const CreateProductSchema = {
  // Multipart body validation is handled in controller
  response: {
    201: createStandardResponseSchema(ProductSchema),
  },
};

/** Schema for updating a product by ID (admin only, multipart/form-data) */
export const UpdateProductSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Product ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(ProductSchema),
  },
};

/** Schema for deleting a product by ID (admin only) */
export const DeleteProductSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Product ULID' }),
  }),
  response: {
    204: Type.Null({ description: 'Product deleted successfully' }),
  },
};

/** Schema for best seller product (extends ProductSchema with total_sold) */
export const BestSellerProductSchema = Type.Intersect([
  ProductSchema,
  Type.Object({
    total_sold: Type.Number({ description: 'Total quantity sold' }),
  })
]);

/** Schema for getting best seller products */
export const GetBestSellersSchema = {
  query: Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 5, description: 'Number of products to show' })),
  }),
  response: {
    200: createStandardResponseSchema(Type.Array(BestSellerProductSchema)),
  },
};

/** TypeScript type for list products query parameters */
export type ListProductsQuery = Static<typeof ListProductsSchema.query>;
/** TypeScript type for product object */
export type Product = Static<typeof ProductSchema>;
/** TypeScript type for best sellers query parameters */
export type GetBestSellersQuery = Static<typeof GetBestSellersSchema.query>;
