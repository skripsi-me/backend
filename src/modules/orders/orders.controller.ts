import { type FastifyReply, type FastifyRequest } from 'fastify';
import { OrdersService } from './orders.service.js';
import { type UpdateOrderStatusBody } from './orders.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    try {
      const order = await this.ordersService.createFromCart(userId);
      return reply.status(201).success(order);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(400).send(formatError(400, message));
    }
  }

  async listMine(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const orders = await this.ordersService.listByUser(userId);
    return reply.success(orders);
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id: userId, role } = request.user;
    const order = await this.ordersService.getById(request.params.id);
    
    if (!order) {
      return reply.status(404).send(formatError(404, 'Order not found'));
    }

    if (role !== 'admin' && userId !== order.user_id) {
      return reply.status(403).send(formatError(403, 'Access denied'));
    }

    return reply.success(order);
  }

  async listAll(_request: FastifyRequest, reply: FastifyReply) {
    const orders = await this.ordersService.listAll();
    return reply.success(orders);
  }

  async updateStatus(request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrderStatusBody }>, reply: FastifyReply) {
    const order = await this.ordersService.updateStatus(request.params.id, request.body.status);
    return reply.success(order);
  }
}
