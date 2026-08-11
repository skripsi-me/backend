import { type FastifyReply, type FastifyRequest } from 'fastify';
import { CartsService } from './carts.service.js';
import { type AddToCartBody, type UpdateCartItemBody } from './carts.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

/**
 * Controller for shopping cart endpoints.
 * Handles cart retrieval, item addition, updates, and removal.
 */
export class CartsController {
  constructor(private cartsService: CartsService) {}

  /**
   * Get the authenticated user's cart with items.
   * @param request - Fastify request (uses request.user.id)
   * @param reply - Fastify reply
   * @returns 200 with cart object
   */
  async getCart(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.getByUserId(userId);
    return reply.success(cart);
  }

  /**
   * Add an item to the cart.
   * @param request - Fastify request with AddToCartBody
   * @param reply - Fastify reply
   * @returns 200 with updated cart
   */
  async addItem(request: FastifyRequest<{ Body: AddToCartBody }>, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.addItem(userId, request.body);
    return reply.success(cart);
  }

  /**
   * Update cart item quantity.
   * @param request - Fastify request with item_id param and UpdateCartItemBody
   * @param reply - Fastify reply
   * @returns 200 with updated cart
   */
  async updateItem(request: FastifyRequest<{ Params: { itemId: string }; Body: UpdateCartItemBody }>, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const cart = await this.cartsService.updateItem(userId, request.params.itemId, request.body);
      return reply.success(cart);
    } catch (err) {
      if (err instanceof Error && err.message === 'Item keranjang tidak ditemukan.') {
        return reply.status(404).send(formatError(404, 'Item keranjang tidak ditemukan.'));
      }
      throw err;
    }
  }

  /**
   * Remove an item from the cart.
   * @param request - Fastify request with item_id param
   * @param reply - Fastify reply
   * @returns 200 with updated cart
   */
  async removeItem(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const cart = await this.cartsService.removeItem(userId, request.params.itemId);
      return reply.success(cart);
    } catch (err) {
      if (err instanceof Error && err.message === 'Item keranjang tidak ditemukan.') {
        return reply.status(404).send(formatError(404, 'Item keranjang tidak ditemukan.'));
      }
      throw err;
    }
  }
}
