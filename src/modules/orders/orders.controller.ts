import { type FastifyReply, type FastifyRequest } from 'fastify';
import { OrdersService } from './orders.service.js';
import { type UpdateOrderStatusBody } from './orders.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

/**
 * Controller for order management endpoints.
 * Handles order creation, listing, status updates, and reporting.
 */
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * Get order report by date range (admin only).
   * @param request - Fastify request with optional start_date and end_date query
   * @param reply - Fastify reply
   * @returns 200 with array of report entries
   */
  async getReport(request: FastifyRequest, reply: FastifyReply) {
    const { start_date, end_date } = request.query as { start_date?: string; end_date?: string };

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

  /**
   * Create order from cart items (checkout).
   * @param request - Fastify request (uses request.user.id)
   * @param reply - Fastify reply
   * @returns 201 with created order or 400 if cart is empty
   */
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

  /**
   * List orders for the authenticated user.
   * @param request - Fastify request (uses request.user.id)
   * @param reply - Fastify reply
   * @returns 200 with array of orders
   */
  async listMine(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const orders = await this.ordersService.listByUser(userId);
    return reply.success(orders);
  }

  /**
   * Get order by ID. Users can only see their own orders; admins can see all.
   * @param request - Fastify request with order ID param
   * @param reply - Fastify reply
   * @returns 200 with order or 404 if not found or 403 if forbidden
   */
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

  /**
   * List all orders with user info (admin only).
   * @param request - Fastify request
   * @param reply - Fastify reply
   * @returns 200 with array of orders
   */
  async listAll(_request: FastifyRequest, reply: FastifyReply) {
    const orders = await this.ordersService.listAll();
    return reply.success(orders);
  }

  /**
   * Update order status (admin only).
   * @param request - Fastify request with order ID and UpdateOrderStatusBody
   * @param reply - Fastify reply
   * @returns 200 with updated order
   */
  async updateStatus(request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrderStatusBody }>, reply: FastifyReply) {
    const order = await this.ordersService.updateStatus(request.params.id, request.body.status);
    return reply.success(order);
  }
}
