import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { 
  CreateCategorySchema, 
  UpdateCategorySchema,
  GetCategoriesSchema,
  GetCategoryBySlugSchema,
  DeleteCategorySchema
} from './categories.schema.js';

export const categoriesRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const categoriesService = new CategoriesService();
  const categoriesController = new CategoriesController(categoriesService);

  provider.get('/', { 
    schema: {
      ...GetCategoriesSchema,
      tags: ['Categories'],
      summary: 'Get all categories',
      description: 'Returns a list of all product categories.'
    } 
  }, categoriesController.getAll.bind(categoriesController));
  
  provider.get('/:slug', {
    schema: {
      ...GetCategoryBySlugSchema,
      tags: ['Categories'],
      summary: 'Get category by slug',
      description: 'Returns a category by its URL-friendly slug.'
    }
  }, categoriesController.getBySlug.bind(categoriesController));

  provider.post('/', {
    schema: {
      ...CreateCategorySchema,
      tags: ['Categories'],
      summary: 'Create new category (Admin)',
      description: 'Creates a new product category. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, categoriesController.create.bind(categoriesController));

  provider.patch('/:id', {
    schema: {
      ...UpdateCategorySchema,
      tags: ['Categories'],
      summary: 'Update category (Admin)',
      description: 'Updates a product category by its ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, categoriesController.update.bind(categoriesController));

  provider.delete('/:id', {
    schema: {
      ...DeleteCategorySchema,
      tags: ['Categories'],
      summary: 'Delete category (Admin)',
      description: 'Deletes a product category by its ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, categoriesController.delete.bind(categoriesController));
};
