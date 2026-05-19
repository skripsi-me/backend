import { db } from '../../config/database.js';
import { orders, orderItems, cartItems, products, users } from '../../db/schema.js';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { CartsService } from '../carts/carts.service.js';

export class OrdersService {
  private cartsService = new CartsService();

  async getReport(startDate: Date, endDate: Date) {
    const result = await db.select({
      date: sql<string>`DATE(${orders.createdAt})`,
      total_amount: sql<number>`SUM(${orders.totalAmount})`,
      order_count: sql<number>`COUNT(${orders.id})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

    return result.map(row => ({
      ...row,
      total_amount: Number(row.total_amount),
      order_count: Number(row.order_count),
    }));
  }

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

      // Decrease stock
      for (const item of cart.items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.product_id));
      }

      // Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    });

    return this.getById(orderId);
  }

  async getById(id: string) {
    const [order] = await db.select({
      id: orders.id,
      user_id: orders.userId,
      total_amount: orders.totalAmount,
      status: orders.status,
      created_at: orders.createdAt,
    }).from(orders).where(eq(orders.id, id)).limit(1);

    if (!order) return null;

    const items = await db.select({
      id: orderItems.id,
      order_id: orderItems.orderId,
      product_id: orderItems.productId,
      quantity: orderItems.quantity,
      price_at_purchase: orderItems.priceAtPurchase,
      product: {
        name: products.name,
      }
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items
    };
  }

  async listByUser(userId: string) {
    return db.select({
      id: orders.id,
      user_id: orders.userId,
      total_amount: orders.totalAmount,
      status: orders.status,
      created_at: orders.createdAt,
    }).from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async listAll() {
    return db.select({
      id: orders.id,
      user_id: orders.userId,
      total_amount: orders.totalAmount,
      status: orders.status,
      created_at: orders.createdAt,
      user: {
        email: users.email
      }
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));
  }

  async updateStatus(id: string, status: string) {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return this.getById(id);
  }
}
