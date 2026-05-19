import { type FastifyReply, type FastifyRequest } from 'fastify';
import { OrdersService } from './orders.service.js';
import { type UpdateOrderStatusBody, type GetOrderReportQuery } from './orders.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  async getReport(request: FastifyRequest<{ Querystring: GetOrderReportQuery }>, reply: FastifyReply) {
    const { start_date, end_date } = request.query;

    let start: Date;
    let end: Date;

    if (start_date && end_date) {
      start = new Date(start_date);
      end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to this month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const report = await this.ordersService.getReport(start, end);
    return reply.success(report);
  }

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
