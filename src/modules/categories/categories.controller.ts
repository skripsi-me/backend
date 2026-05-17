import { type FastifyReply, type FastifyRequest } from 'fastify';
import { CategoriesService } from './categories.service.js';
import { type CreateCategoryBody, type UpdateCategoryBody } from './categories.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    const categories = await this.categoriesService.getAll();
    return reply.success(categories);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const category = await this.categoriesService.getById(request.params.id);
    if (!category) {
      return reply.status(404).send(formatError(404, 'Category not found'));
    }
    return reply.success(category);
  }

  async create(request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) {
    const category = await this.categoriesService.create(request.body);
    return reply.status(201).success(category);
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryBody }>, reply: FastifyReply) {
    const category = await this.categoriesService.update(request.params.id, request.body);
    if (!category) {
      return reply.status(404).send(formatError(404, 'Category not found'));
    }
    return reply.success(category);
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.categoriesService.delete(request.params.id);
    return reply.status(204).send();
  }
}
