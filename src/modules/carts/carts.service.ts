import { db } from '../../config/database.js';
import { carts, cartItems, products } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type AddToCartBody, type UpdateCartItemBody, type Cart } from './carts.schema.js';
import { NotFoundError } from '../../shared/utils/errors.js';

/**
 * Service for shopping cart operations.
 * Handles cart retrieval, item management, and cart clearing.
 */
export class CartsService {
  /**
   * Get cart by user ID. Creates a new cart if none exists.
   * @param userId - User ULID
   * @returns Cart object with items and product details
   */
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

  /**
   * Add item to cart. If product already exists, increments quantity.
   * @param userId - User ULID
   * @param data - Cart item data (product_id, quantity)
   * @returns Updated cart with items
   */
  async addItem(userId: string, data: AddToCartBody) {
    const cart = await this.getByUserId(userId);

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, data.product_id))
      .limit(1);
    if (!product) throw new NotFoundError('Produk tidak ditemukan.');

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

  /**
   * Update cart item quantity.
   * @param userId - User ULID
   * @param itemId - Cart item ULID
   * @param data - New quantity
   * @returns Updated cart with items
   */
  async updateItem(userId: string, itemId: string, data: UpdateCartItemBody) {
    const cart = await this.getByUserId(userId);

    const [existing] = await db
      .select({ id: cartItems.id })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Item keranjang tidak ditemukan.');
    }

    await db.update(cartItems)
      .set({ quantity: data.quantity })
      .where(eq(cartItems.id, itemId));

    return this.getByUserId(userId);
  }

  /**
   * Remove item from cart.
   * @param userId - User ULID
   * @param itemId - Cart item ULID
   * @returns Updated cart with items
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getByUserId(userId);
    
    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id))) as any;

    if (result.affectedRows === 0) {
      throw new NotFoundError('Item keranjang tidak ditemukan.');
    }

    return this.getByUserId(userId);
  }

  /**
   * Clear all items from cart.
   * @param userId - User ULID
   */
  async clearCart(userId: string) {
    const cart = await this.getByUserId(userId);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }
}
