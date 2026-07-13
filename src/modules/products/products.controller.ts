import { type FastifyReply, type FastifyRequest } from 'fastify';
import { ProductsService } from './products.service.js';
import { type ListProductsQuery, type GetBestSellersQuery, type CreateProductBody, type UpdateProductBody } from './products.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

/**
 * Controller for product management endpoints.
 * Handles listing, searching, creating, updating, and deleting products.
 */
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * Get best seller products (public).
   * @param request - Fastify request with optional limit query
   * @param reply - Fastify reply
   * @returns 200 with array of best seller products
   */
  async getBestSellers(request: FastifyRequest<{ Querystring: GetBestSellersQuery }>, reply: FastifyReply) {
    const limit = request.query.limit || 5;
    const products = await this.productsService.getBestSellers(limit);
    return reply.success(products);
  }

  /**
   * List products with pagination, search, and category filter (public).
   * @param request - Fastify request with ListProductsQuery
   * @param reply - Fastify reply
   * @returns 200 with paginated products
   */
  async list(request: FastifyRequest<{ Querystring: ListProductsQuery }>, reply: FastifyReply) {
    const result = await this.productsService.list(request.query);
    return reply.success(result);
  }

  /**
   * Get product by ID (admin only).
   * @param request - Fastify request with product ID param
   * @param reply - Fastify reply
   * @returns 200 with product or 404 if not found
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getById(request.params.id);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  /**
   * Get product by slug (public).
   * @param request - Fastify request with slug param
   * @param reply - Fastify reply
   * @returns 200 with product or 404 if not found
   */
  async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getBySlug(request.params.slug);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  /**
   * List products by category slug (public).
   * @param request - Fastify request with category_slug param and pagination query
   * @param reply - Fastify reply
   * @returns 200 with paginated products
   */
  async listByCategorySlug(request: FastifyRequest<{ Params: { categorySlug: string }; Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) {
    const result = await this.productsService.listByCategorySlug(request.params.categorySlug, request.query);
    return reply.success(result, 'Products retrieved successfully');
  }

  /**
   * Create a new product (admin only).
   * @param request - Fastify request with CreateProductBody
   * @param reply - Fastify reply
   * @returns 201 with created product
   */
  async create(request: FastifyRequest<{ Body: CreateProductBody }>, reply: FastifyReply) {
    const product = await this.productsService.create(request.body);
    return reply.status(201).success(product);
  }

  /**
   * Update product by ID (admin only).
   * @param request - Fastify request with product ID and UpdateProductBody
   * @param reply - Fastify reply
   * @returns 200 with updated product or 404 if not found
   */
  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductBody }>, reply: FastifyReply) {
    const product = await this.productsService.update(request.params.id, request.body);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Product not found'));
    }
    return reply.success(product);
  }

  /**
   * Delete product by ID (admin only).
   * @param request - Fastify request with product ID param
   * @param reply - Fastify reply
   * @returns 200 with success status
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.productsService.delete(request.params.id);
    return reply.success(result);
  }
}
