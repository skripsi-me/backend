import { Type, type Static } from '@sinclair/typebox';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  PaginationMetaSchema,
  PaginationQuerySchema,
  SortQuerySchema,
} from '../../shared/schemas/pagination.schema.js';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

/** Schema for category object within product */
export const ProductCategorySchema = Type.Object({
  name: Type.String({ description: 'Category name' }),
  slug: Type.String({ description: 'Category slug' }),
  description: Type.Union([Type.String(), Type.Null()], { description: 'Category description' }),
});

/** Base schema for product object */
export const ProductSchema = Type.Object({
  id: Type.String({ description: 'Product ULID' }),
  category_id: Type.Union([Type.String(), Type.Null()], { description: 'Category ULID' }),
  name: Type.String({ description: 'Product name' }),
  slug: Type.String({ description: 'URL-friendly product name' }),
  description: Type.Union([Type.String(), Type.Null()], { description: 'Product description' }),
  price: Type.Number({ description: 'Product price' }),
  stock: Type.Number({ description: 'Available stock quantity' }),
  image_url: Type.Union([Type.String(), Type.Null()], { description: 'Product image URL' }),
  category: Type.Optional(
    Type.Union([ProductCategorySchema, Type.Null()], { description: 'Category details' }),
  ),
  created_at: Type.Any({ description: 'Creation timestamp' }),
  updated_at: Type.Any({ description: 'Last update timestamp' }),
});

/** Schema for listing products with pagination, search, and category filter */
export const ListProductsSchema = {
  query: Type.Composite([
    PaginationQuerySchema,
    SortQuerySchema,
    Type.Object({
      search: Type.Optional(Type.String({ description: 'Search term for name or description' })),
      category_id: Type.Optional(Type.String({ description: 'Filter by category ULID' })),
      stock: Type.Optional(
        Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
          description: 'Sort order by stock. Values: asc (lowest stock first) or desc (highest stock first)',
        }),
      ),
    }),
  ]),
  response: {
    200: createStandardResponseSchema(
      Type.Object({
        data: Type.Array(ProductSchema),
        meta: PaginationMetaSchema,
      }),
    ),
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
    categorySlug: Type.String({ description: 'Category slug' }),
  }),
  query: Type.Composite([PaginationQuerySchema, SortQuerySchema]),
  response: {
    200: createStandardResponseSchema(
      Type.Object({
        data: Type.Array(ProductSchema),
        meta: PaginationMetaSchema,
      }),
    ),
  },
};

/** Schema for creating a new product (admin only) */
export const CreateProductSchema = {
  body: Type.Object({
    name: Type.String({ minLength: 1, description: 'Product name' }),
    description: Type.Optional(Type.String({ description: 'Product description' })),
    price: Type.Number({ minimum: 0, description: 'Product price' }),
    stock: Type.Number({ minimum: 0, description: 'Stock quantity' }),
    category_id: Type.String({ description: 'Category ULID' }),
    image_url: Type.Optional(
      Type.Union([Type.String(), Type.Null()], { description: 'Product image URL' }),
    ),
  }),
  response: {
    201: createStandardResponseSchema(ProductSchema),
  },
};

/** Schema for updating a product by ID (admin only) */
export const UpdateProductSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Product ULID' }),
  }),
  body: Type.Object({
    name: Type.Optional(Type.String({ minLength: 1, description: 'Product name' })),
    description: Type.Optional(Type.String({ description: 'Product description' })),
    price: Type.Optional(Type.Number({ minimum: 0, description: 'Product price' })),
    stock: Type.Optional(Type.Number({ minimum: 0, description: 'Stock quantity' })),
    category_id: Type.Optional(Type.String({ description: 'Category ULID' })),
    image_url: Type.Optional(
      Type.Union([Type.String(), Type.Null()], { description: 'Product image URL' }),
    ),
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
    200: createStandardResponseSchema(
      Type.Object({
        success: Type.Boolean({ description: 'Deletion status' }),
      }),
    ),
  },
};

/** Schema for best seller product (extends ProductSchema with total_sold) */
export const BestSellerProductSchema = Type.Intersect([
  ProductSchema,
  Type.Object({
    total_sold: Type.Number({ description: 'Total quantity sold' }),
  }),
]);

/** Schema for getting best seller products */
export const GetBestSellersSchema = {
  query: Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: MAX_LIMIT,
        default: DEFAULT_LIMIT,
        description: 'Number of products to show',
      }),
    ),
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
/** TypeScript type for create product request body */
export type CreateProductBody = Static<typeof CreateProductSchema.body>;
/** TypeScript type for update product request body */
export type UpdateProductBody = Static<typeof UpdateProductSchema.body>;
