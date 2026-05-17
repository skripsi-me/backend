import { db } from '../../config/database.js';
import { orders, orderItems, cartItems, products, users } from '../../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { CartsService } from '../carts/carts.service.js';

export class OrdersService {
  private cartsService = new CartsService();

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
        productId: item.productId,
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
          .where(eq(products.id, item.productId));
      }

      // Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    });

    return this.getById(orderId);
  }

  async getById(id: string) {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = orderResult[0];
    if (!order) return null;

    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
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
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async listAll() {
    return db.select({
      id: orders.id,
      userId: orders.userId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
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
