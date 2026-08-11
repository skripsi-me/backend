import { type FastifyReply, type FastifyRequest } from 'fastify';
import { type OrdersService } from './orders.service.js';
import { type UpdateOrderStatusBody, type ListOrdersQuery } from './orders.schema.js';
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

    if (start_date && end_date) {
      const start = new Date(`${start_date}T00:00:00`);
      const end = new Date(`${end_date}T00:00:00`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return reply.status(400).send(formatError(400, 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.'));
      }

      if (start > end) {
        return reply.status(400).send(formatError(400, 'Tanggal awal harus sebelum tanggal akhir.'));
      }

      const report = await this.ordersService.getReport(start_date, end_date);
      return reply.success(report);
    }

    if (start_date || end_date) {
      return reply.status(400).send(formatError(400, 'Harap kirim start_date dan end_date sekaligus.'));
    }

    // Default to this month
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ).padStart(2, '0')}`;

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
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      request.log.warn({ userId, error: message }, 'Order creation failed');
      return reply.status(400).send(formatError(400, message));
    }
  }

  /**
   * List orders for the authenticated user.
   * @param request - Fastify request (uses request.user.id)
   * @param reply - Fastify reply
   * @returns 200 with array of orders
   */
  async listMine(request: FastifyRequest<{ Querystring: ListOrdersQuery }>, reply: FastifyReply) {
    const userId = request.user.id;
    const result = await this.ordersService.listByUser(userId, request.query);
    return reply.success(result);
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
      return reply.status(404).send(formatError(404, 'Pesanan tidak ditemukan.'));
    }

    if (role !== 'admin' && userId !== order.user_id) {
      return reply.status(403).send(formatError(403, 'Anda tidak memiliki akses ke pesanan ini.'));
    }

    return reply.success(order);
  }

  /**
   * List all orders with user info (admin only).
   * @param request - Fastify request
   * @param reply - Fastify reply
   * @returns 200 with array of orders
   */
  async listAll(request: FastifyRequest<{ Querystring: ListOrdersQuery }>, reply: FastifyReply) {
    const result = await this.ordersService.listAll(request.query);
    return reply.success(result);
  }

  /**
   * Update order status (admin only).
   * @param request - Fastify request with order ID and UpdateOrderStatusBody
   * @param reply - Fastify reply
   * @returns 200 with updated order
   */
  async updateStatus(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrderStatusBody }>,
    reply: FastifyReply,
  ) {
    const order = await this.ordersService.updateStatus(request.params.id, request.body.status);
    if (!order) {
      return reply.status(404).send(formatError(404, 'Pesanan tidak ditemukan.'));
    }
    return reply.success(order);
  }
}
