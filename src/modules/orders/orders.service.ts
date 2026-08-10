import { db } from '../../config/database.js';
import { orders, orderItems, cartItems, products, users } from '../../db/schema.js';
import { eq, sql, desc, asc, and, gte, lte, count } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { CartsService } from '../carts/carts.service.js';
import { type ListOrdersQuery } from './orders.schema.js';

/**
 * Service for order management operations.
 * Handles order creation, retrieval, status updates, and reporting.
 */
export class OrdersService {
  private cartsService = new CartsService();

  /**
   * Get order report grouped by date within a date range.
   * @param startDate - Start date for report
   * @param endDate - End date for report (inclusive)
   * @returns Array of report entries with date, total_amount, and order_count
   */
  async getReport(startDate: Date, endDate: Date) {
    const result = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        total_amount: sql<number>`SUM(${orders.totalAmount})`,
        order_count: sql<number>`COUNT(${orders.id})`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return result.map((row) => ({
      ...row,
      total_amount: Number(row.total_amount),
      order_count: Number(row.order_count),
    }));
  }

  /**
   * Create order from cart items (checkout).
   * Decreases stock, clears cart, and creates order with items.
   * @param userId - User ULID
   * @returns Created order with items
   * @throws Error if cart is empty
   */
  async createFromCart(userId: string) {
    const cart = await this.cartsService.getByUserId(userId);

    if (!cart.items.length) {
      throw new Error('Cart is empty');
    }

    const orderId = ulid();
    let totalAmount = 0;

    const orderItemsData = cart.items.map((item: any) => {
      const price = parseFloat(item.product!.price);
      totalAmount += price * item.quantity;

      return {
        id: ulid(),
        orderId,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: item.product!.price,
      };
    });

    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        userId,
        totalAmount: totalAmount.toFixed(2),
        status: 'pending',
      });

      await tx.insert(orderItems).values(orderItemsData);

      // Atomic stock decrement — cek affectedRows
      for (const item of cart.items) {
        const result = (await tx
          .update(products)
          .set({ stock: sql`stock - ${item.quantity}` })
          .where(and(eq(products.id, item.product_id), sql`stock >= ${item.quantity}`))) as any;

        if (result.affectedRows === 0) {
          const [product] = await tx
            .select({ name: products.name, stock: products.stock })
            .from(products)
            .where(eq(products.id, item.product_id))
            .limit(1);
          const name = product?.name || item.product_id;
          const available = product?.stock ?? 0;
          throw new Error(
            `Insufficient stock for ${name}. Available: ${available}, requested: ${item.quantity}`,
          );
        }
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    });

    return this.getById(orderId);
  }

  /**
   * Get order by ID with items.
   * @param id - Order ULID
   * @returns Order object with items and product names, or null if not found
   */
  async getById(id: string) {
    const [order] = await db
      .select({
        id: orders.id,
        user_id: orders.userId,
        total_amount: orders.totalAmount,
        status: orders.status,
        created_at: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;

    const items = await db
      .select({
        id: orderItems.id,
        order_id: orderItems.orderId,
        product_id: orderItems.productId,
        quantity: orderItems.quantity,
        price_at_purchase: orderItems.priceAtPurchase,
        product: {
          name: products.name,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  /**
   * List orders by user ID, sorted by newest first.
   * @param userId - User ULID
   * @returns Array of order objects
   */
  async listByUser(userId: string, query: ListOrdersQuery = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const whereClause = query.status
      ? and(eq(orders.userId, userId), eq(orders.status, query.status))
      : eq(orders.userId, userId);
    const orderBy = query.sort === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: orders.id,
          user_id: orders.userId,
          total_amount: orders.totalAmount,
          status: orders.status,
          created_at: orders.createdAt,
        })
        .from(orders)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(orders).where(whereClause),
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, total_pages },
    };
  }

  /**
   * List all orders with user email (admin only).
   * @returns Array of order objects with user info
   */
  async listAll(query: ListOrdersQuery = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const whereClause = query.status ? eq(orders.status, query.status) : undefined;
    const orderBy = query.sort === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: orders.id,
          user_id: orders.userId,
          total_amount: orders.totalAmount,
          status: orders.status,
          created_at: orders.createdAt,
          user: {
            email: users.email,
          },
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(orders).where(whereClause),
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, total_pages },
    };
  }

  /**
   * Update order status.
   * @param id - Order ULID
   * @param status - New status (pending, shipped, delivered, cancelled)
   * @returns Updated order with items
   */
  async updateStatus(id: string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled') {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return this.getById(id);
  }
}
