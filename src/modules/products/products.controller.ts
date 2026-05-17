import { type FastifyReply, type FastifyRequest } from 'fastify';
import { ProductsService } from './products.service.js';
import { type ListProductsQuery } from './products.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class ProductsController {
  constructor(private productsService: ProductsService) {}

  async list(request: FastifyRequest<{ Querystring: ListProductsQuery }>, reply: FastifyReply) {
    const result = await this.productsService.list(request.query);
    return reply.success(result);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getById(request.params.id);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getBySlug(request.params.slug);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  async listByCategorySlug(request: FastifyRequest<{ Params: { categorySlug: string }; Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const result = await this.productsService.listByCategorySlug(request.params.categorySlug, request.query);
    return reply.success(result, 'Products retrieved successfully');
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parts = request.parts();
    const body: Record<string, any> = {};
    let file: { buffer: Buffer; filename: string } | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        file = {
          buffer: await part.toBuffer(),
          filename: part.filename,
        };
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const product = await this.productsService.create(body, file || undefined);
    return reply.status(201).success(product);
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parts = request.parts();
    const body: Record<string, any> = {};
    let file: { buffer: Buffer; filename: string } | null = null;

    for await (const part of parts) {
      if (part.type === 'file') {
        file = {
          buffer: await part.toBuffer(),
          filename: part.filename,
        };
      } else {
        body[part.fieldname] = part.value;
      }
    }

    const product = await this.productsService.update(request.params.id, body, file || undefined);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product);
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.productsService.delete(request.params.id);
    return reply.status(204).send();
  }
}
