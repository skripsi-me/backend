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
  GetBestSellersSchema
} from './products.schema.js';

export const productsRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const productsService = new ProductsService();
  const productsController = new ProductsController(productsService);

  provider.get('/best-sellers', {
    schema: {
      ...GetBestSellersSchema,
      tags: ['Products'],
      summary: 'Get best seller products',
      description: 'Returns a list of products ordered by total quantity sold. Default limit is 5.',
    }
  }, productsController.getBestSellers.bind(productsController));

  provider.get('/', { 
    schema: {
      ...ListProductsSchema,
      tags: ['Products'],
      summary: 'List all products',
      description: 'Returns a paginated list of products with optional filtering by search term or category.'
    } 
  }, productsController.list.bind(productsController));

  provider.get('/:id', { 
    schema: {
      ...GetProductSchema,
      tags: ['Products'],
      summary: 'Get product by ID (Admin)',
      description: 'Returns a product by its ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly] 
  }, productsController.getById.bind(productsController));
  
  provider.get('/slug/:slug', { 
    schema: {
      ...GetProductBySlugSchema,
      tags: ['Products'],
      summary: 'Get product by slug',
      description: 'Returns a single product by its URL-friendly slug.'
    } 
  }, productsController.getBySlug.bind(productsController));

  provider.get('/category/:categorySlug', { 
    schema: {
      ...ListProductsByCategorySchema,
      tags: ['Products'],
      summary: 'List products by category slug',
      description: 'Returns a paginated list of products belonging to a specific category.'
    } 
  }, productsController.listByCategorySlug.bind(productsController));

  provider.post('/', {
    schema: {
      ...CreateProductSchema,
      tags: ['Products'],
      summary: 'Create new product (Admin)',
      description: 'Creates a new product with image upload. Uses multipart/form-data. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, productsController.create.bind(productsController));

  provider.put('/:id', {
    schema: {
      ...UpdateProductSchema,
      tags: ['Products'],
      summary: 'Update product (Admin)',
      description: 'Updates a product by its ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, productsController.update.bind(productsController));

  provider.delete('/:id', {
    schema: {
      ...DeleteProductSchema,
      tags: ['Products'],
      summary: 'Delete product (Admin)',
      description: 'Deletes a product by its ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, productsController.delete.bind(productsController));
};
