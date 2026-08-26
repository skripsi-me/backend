import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import {
  ListProductsSchema,
  GetProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  GetProductBySlugSchema,
  ListProductsByCategorySchema,
  GetBestSellersSchema,
  BulkCreateProductsSchema,
} from './products.schema.js';
import { formatError } from '../../shared/utils/response.util.js';
import { env } from '../../config/env.js';

export const productsRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const productsService = new ProductsService();
  const productsController = new ProductsController(productsService);

  // ponytail: API key statis tunggal; per-client/key-rotation butuh tabel key.
  const apiKeyGuard = async (request: any, reply: any) => {
    if (request.headers['x-api-key'] !== env.BULK_UPLOAD_KEY) {
      return reply.status(401).send(formatError(401, 'Akses ditolak. API key tidak valid.'));
    }
  };

  provider.get('/best-sellers', {
    schema: {
      ...GetBestSellersSchema,
      tags: ['Products'],
      summary: 'Get best seller products',
      description: 'Returns a list of products ordered by total quantity sold. Default limit is 20.',
    }
  }, productsController.getBestSellers.bind(productsController) as any);

  provider.get('/', { 
    schema: {
      ...ListProductsSchema,
      tags: ['Products'],
      summary: 'List all products',
      description: 'Returns a paginated list of products with optional filtering by search term or category.'
    } 
  }, productsController.list.bind(productsController) as any);

  provider.get('/:id', { 
    schema: {
      ...GetProductSchema,
      tags: ['Products'],
      summary: 'Get product by ID (Admin)',
      description: 'Returns a product by its ULID. Required admin privileges.',
      security: [{ cookieAuth: [] }]
    },
    onRequest: [fastify.adminOnly] 
  }, productsController.getById.bind(productsController) as any);
  
  provider.get('/slug/:slug', { 
    schema: {
      ...GetProductBySlugSchema,
      tags: ['Products'],
      summary: 'Get product by slug',
      description: 'Returns a single product by its URL-friendly slug.'
    } 
  }, productsController.getBySlug.bind(productsController) as any);

  provider.get('/category/:categorySlug', { 
    schema: {
      ...ListProductsByCategorySchema,
      tags: ['Products'],
      summary: 'List products by category slug',
      description: 'Returns a paginated list of products belonging to a specific category.'
    } 
  }, productsController.listByCategorySlug.bind(productsController) as any);

  provider.post('/', {
    schema: {
      tags: ['Products'],
      summary: 'Create new product (Admin)',
      description: 'Creates a new product. Slug is auto-generated from name. Required admin privileges. Supports image upload via multipart/form-data.',
      security: [{ cookieAuth: [] }],
      response: CreateProductSchema.response,
    },
    onRequest: [fastify.adminOnly],
  }, productsController.create.bind(productsController) as any);

  provider.post('/bulk', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      ...BulkCreateProductsSchema,
      tags: ['Products'],
      summary: 'Bulk create products (API key)',
      description: 'Creates multiple products from a JSON array. Per-item result: valid items inserted, failed items reported. Requires x-api-key header.',
    },
    preHandler: [apiKeyGuard],
  }, productsController.createBulk.bind(productsController) as any);

  provider.patch('/:id', {
    schema: {
      params: UpdateProductSchema.params,
      tags: ['Products'],
      summary: 'Update product (Admin)',
      description: 'Updates a product by its ULID. Slug is auto-regenerated when name changes. Required admin privileges. Supports image upload via multipart/form-data.',
      security: [{ cookieAuth: [] }],
      response: UpdateProductSchema.response,
    },
    onRequest: [fastify.adminOnly],
  }, productsController.update.bind(productsController) as any);

  provider.delete('/:id', {
    schema: {
      ...DeleteProductSchema,
      tags: ['Products'],
      summary: 'Delete product (Admin)',
      description: 'Deletes a product by its ULID. Required admin privileges.',
      security: [{ cookieAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, productsController.delete.bind(productsController) as any);
};
