import { type FastifyReply, type FastifyRequest } from 'fastify';
import { CategoriesService } from './categories.service.js';
import { type CreateCategoryBody, type UpdateCategoryBody } from './categories.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

/**
 * Controller for category management endpoints.
 * Handles listing, creating, updating, and deleting categories.
 */
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  /**
   * Get all categories (public).
   * @param request - Fastify request
   * @param reply - Fastify reply
   * @returns 200 with array of categories
   */
  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    const categories = await this.categoriesService.getAll();
    return reply.success(categories);
  }

  /**
   * Get category by ID (admin only).
   * @param request - Fastify request with category ID param
   * @param reply - Fastify reply
   * @returns 200 with category or 404 if not found
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const category = await this.categoriesService.getById(request.params.id);
    if (!category) {
      return reply.status(404).send(formatError(404, 'Category not found'));
    }
    return reply.success(category);
  }

  /**
   * Create a new category (admin only).
   * @param request - Fastify request with CreateCategoryBody
   * @param reply - Fastify reply
   * @returns 201 with created category
   */
  async create(request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) {
    const category = await this.categoriesService.create(request.body);
    return reply.status(201).success(category);
  }

  /**
   * Update category by ID (admin only).
   * @param request - Fastify request with category ID and UpdateCategoryBody
   * @param reply - Fastify reply
   * @returns 200 with updated category or 404 if not found
   */
  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryBody }>, reply: FastifyReply) {
    const category = await this.categoriesService.update(request.params.id, request.body);
    if (!category) {
      return reply.status(404).send(formatError(404, 'Category not found'));
    }
    return reply.success(category);
  }

  /**
   * Delete category by ID (admin only).
   * @param request - Fastify request with category ID param
   * @param reply - Fastify reply
   * @returns 204 with no content
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.categoriesService.delete(request.params.id);
    return reply.status(204).send();
  }
}
