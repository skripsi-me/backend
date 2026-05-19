import { db } from '../../config/database.js';
import { carts, cartItems, products } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type AddToCartBody, type UpdateCartItemBody, type Cart } from './carts.schema.js';

export class CartsService {
  async getByUserId(userId: string): Promise<Cart> {
    const [cartData] = await db.select({
      id: carts.id,
      user_id: carts.userId,
    }).from(carts).where(eq(carts.userId, userId)).limit(1);

    if (!cartData) {
      const id = ulid();
      await db.insert(carts).values({ id, userId });
      return this.getByUserId(userId);
    }

    const items = await db.select({
      id: cartItems.id,
      cart_id: cartItems.cartId,
      product_id: cartItems.productId,
      quantity: cartItems.quantity,
      product: {
        name: products.name,
        price: products.price,
        image_url: products.imageUrl,
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cartData.id));

    return {
      ...cartData,
      items
    };
  }

  async addItem(userId: string, data: AddToCartBody) {
    const cart = await this.getByUserId(userId);
    
    const existingItemResult = await db.select().from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, data.product_id)))
      .limit(1);
    
    const existingItem = existingItemResult[0];

    if (existingItem) {
      await db.update(cartItems)
        .set({ quantity: existingItem.quantity + data.quantity })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        id: ulid(),
        cartId: cart.id,
        productId: data.product_id,
        quantity: data.quantity
      });
    }

    return this.getByUserId(userId);
  }

  async updateItem(userId: string, itemId: string, data: UpdateCartItemBody) {
    const cart = await this.getByUserId(userId);
    
    await db.update(cartItems)
      .set({ quantity: data.quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

    return this.getByUserId(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getByUserId(userId);
    
    await db.delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

    return this.getByUserId(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getByUserId(userId);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }
}
