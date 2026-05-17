import { type FastifyReply, type FastifyRequest } from 'fastify';
import { CartsService } from './carts.service.js';
import { type AddToCartBody, type UpdateCartItemBody } from './carts.schema.js';

export class CartsController {
  constructor(private cartsService: CartsService) {}

  async getCart(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.getByUserId(userId);
    return reply.success(cart);
  }

  async addItem(request: FastifyRequest<{ Body: AddToCartBody }>, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.addItem(userId, request.body);
    return reply.success(cart);
  }

  async updateItem(request: FastifyRequest<{ Params: { itemId: string }; Body: UpdateCartItemBody }>, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.updateItem(userId, request.params.itemId, request.body);
    return reply.success(cart);
  }

  async removeItem(request: FastifyRequest<{ Params: { itemId: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const cart = await this.cartsService.removeItem(userId, request.params.itemId);
    return reply.success(cart);
  }
}
