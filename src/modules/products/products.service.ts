import { db } from '../../config/database.js';
import { products, categories, orderItems } from '../../db/schema.js';
import { eq, or, and, sql, count, desc, asc, like, type SQL } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { sanitize } from '../../shared/utils/sanitize.util.js';
import { type ListProductsQuery } from './products.schema.js';

/**
 * Service for product management operations.
 * Handles CRUD operations, search, filtering, and best sellers.
 */
export class ProductsService {
  private mapProductRow(row: any) {
    return {
      id: row.id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      stock: row.stock,
      image_url: row.image_url,
      category: row.category_id
        ? {
            name: row.category_name,
            slug: row.category_slug,
            description: row.category_description,
          }
        : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Get best seller products sorted by total quantity sold.
   * @param limit - Number of products to return (default: 5)
   * @returns Array of products with total_sold field
   */
  async getBestSellers(query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const result = await db
      .select({
        id: products.id,
        category_id: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        image_url: products.imageUrl,
        category_name: categories.name,
        category_slug: categories.slug,
        category_description: categories.description,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
        total_sold: sql<number>`CAST(SUM(${orderItems.quantity}) AS UNSIGNED)`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .groupBy(products.id)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit)
      .offset(offset);

    return result.map((row) => ({
      ...this.mapProductRow(row),
      total_sold: Number(row.total_sold),
    }));
  }

  /**
   * List products with pagination, search, and category filter.
   * Uses FULLTEXT search on name and description fields.
   * @param query - Query parameters (page, limit, search, category_id)
   * @returns Paginated result with data array and meta object
   */
  async list(query: ListProductsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause: SQL<unknown> | undefined = undefined;

    if (query.search) {
      // Use MATCH AGAINST for fulltext search
      whereClause = or(
        sql`MATCH(${products.name}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`,
        sql`MATCH(${products.description}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`,
      );
    }

    if (query.category_id) {
      const catFilter = eq(products.categoryId, query.category_id);
      whereClause = whereClause ? and(whereClause, catFilter) : catFilter;
    }

    const orderBy = query.sort === 'asc' ? asc(products.createdAt) : desc(products.createdAt);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: products.id,
          category_id: products.categoryId,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          stock: products.stock,
          image_url: products.imageUrl,
          category_name: categories.name,
          category_slug: categories.slug,
          category_description: categories.description,
          created_at: products.createdAt,
          updated_at: products.updatedAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(products).where(whereClause),
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: data.map((row) => this.mapProductRow(row)),
      meta: {
        total,
        page,
        limit,
        total_pages,
      },
    };
  }

  /**
   * Get product by ID.
   * @param id - Product ULID
   * @returns Product object or undefined if not found
   */
  async getById(id: string) {
    const [product] = await db
      .select({
        id: products.id,
        category_id: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        image_url: products.imageUrl,
        category_name: categories.name,
        category_slug: categories.slug,
        category_description: categories.description,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    return product ? this.mapProductRow(product) : undefined;
  }

  /**
   * Get product by slug.
   * @param slug - URL-friendly product slug
   * @returns Product object or undefined if not found
   */
  async getBySlug(slug: string) {
    const [product] = await db
      .select({
        id: products.id,
        category_id: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        image_url: products.imageUrl,
        category_name: categories.name,
        category_slug: categories.slug,
        category_description: categories.description,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);

    return product ? this.mapProductRow(product) : undefined;
  }

  /**
   * List products by category slug with pagination.
   * @param categorySlug - Category slug to filter by
   * @param query - Query parameters (page, limit)
   * @returns Paginated result with data array and meta object
   */
  async listByCategorySlug(
    categorySlug: string,
    query: { page?: number; limit?: number; sort?: 'asc' | 'desc' },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const orderBy = query.sort === 'asc' ? asc(products.createdAt) : desc(products.createdAt);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: products.id,
          category_id: products.categoryId,
          name: products.name,
          slug: products.slug,
          description: products.description,
          price: products.price,
          stock: products.stock,
          image_url: products.imageUrl,
          category_name: categories.name,
          category_slug: categories.slug,
          category_description: categories.description,
          created_at: products.createdAt,
          updated_at: products.updatedAt,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(categories.slug, categorySlug))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(categories.slug, categorySlug)),
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: data.map((row) => this.mapProductRow(row)),
      meta: { total, page, limit, total_pages },
    };
  }

  /**
   * Create a new product.
   * @param data - Product data (name, description, price, stock, category_id, image_url?)
   * @returns Created product object
   */
  async create(data: any) {
    const id = ulid();
    const slug = await this.generateSlug(data.name);

    await db.insert(products).values({
      id,
      name: sanitize(data.name),
      slug,
      description: data.description ? sanitize(data.description) : null,
      price: String(data.price),
      stock: data.stock,
      categoryId: data.category_id,
      imageUrl: data.image_url || null,
    });

    return this.getById(id);
  }

  /**
   * Generate a unique slug from a name.
   * Converts name to lowercase, replaces spaces with hyphens, removes special characters.
   * If slug already exists, appends a number suffix.
   * @param name - The name to generate slug from
   * @returns Unique slug string
   */
  private async generateSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const existing = await db
      .select({ slug: products.slug })
      .from(products)
      .where(like(products.slug, `${slug}%`));

    if (existing.length === 0) return slug;

    let counter = 1;
    while (existing.some((e) => e.slug === `${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }

  /**
   * Update product by ID.
   * @param id - Product ULID
   * @param data - Partial product data to update
   * @returns Updated product object
   */
  async update(id: string, data: any) {
    const updateData: Record<string, any> = { ...data };

    if (data.price !== undefined) updateData.price = String(data.price);
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.name !== undefined) updateData.name = sanitize(data.name);
    if (data.description !== undefined)
      updateData.description = data.description ? sanitize(data.description) : null;

    if (data.name) {
      updateData.slug = await this.generateSlug(data.name);
    }

    if (data.image_url !== undefined) {
      updateData.imageUrl = data.image_url;
      delete updateData.image_url;
    }

    if (data.category_id) {
      updateData.categoryId = data.category_id;
      delete updateData.category_id;
    }

    await db.update(products).set(updateData).where(eq(products.id, id));
    return this.getById(id);
  }

  /**
   * Delete product by ID.
   * @param id - Product ULID
   * @returns Success object
   */
  async delete(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }
}
