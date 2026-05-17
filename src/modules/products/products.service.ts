import { db } from '../../config/database.js';
import { products, categories } from '../../db/schema.js';
import { eq, or, and, sql, count } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type ListProductsQuery } from './products.schema.js';
import { uploadImage } from '../../shared/utils/imagekit.util.js';

export class ProductsService {
  async list(query: ListProductsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    let whereClause: any = undefined;

    if (query.search) {
      // Use MATCH AGAINST for fulltext search
      whereClause = or(
        sql`MATCH(${products.name}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`,
        sql`MATCH(${products.description}) AGAINST(${query.search} IN NATURAL LANGUAGE MODE)`
      );
    }

    if (query.categoryId) {
      const catFilter = eq(products.categoryId, query.categoryId);
      whereClause = whereClause ? and(whereClause, catFilter) : catFilter;
    }

    const [data, totalResult] = await Promise.all([
      db.select().from(products).where(whereClause).limit(limit).offset(offset),
      db.select({ value: count() }).from(products).where(whereClause)
    ]);

    const total = totalResult[0]?.value || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async getById(id: string) {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getBySlug(slug: string) {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result[0];
  }

  async listByCategorySlug(categorySlug: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db.select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug))
      .limit(limit)
      .offset(offset),
      db.select({ value: count() })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(categories.slug, categorySlug))
    ]);

    const total = totalResult[0]?.value || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async create(data: any, file?: { buffer: Buffer; filename: string }) {
    const id = ulid();
    let imageUrl: string | null = null;

    if (file) {
      imageUrl = await uploadImage(file.buffer, `${id}_${file.filename}`);
    }

    await db.insert(products).values({
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      stock: parseInt(data.stock),
      categoryId: data.categoryId,
      imageUrl,
    });

    return this.getById(id);
  }

  async update(id: string, data: any, file?: { buffer: Buffer; filename: string }) {
    const updateData = { ...data };
    
    if (data.stock) updateData.stock = parseInt(data.stock);

    if (file) {
      updateData.imageUrl = await uploadImage(file.buffer, `${id}_${file.filename}`);
    }

    await db.update(products).set(updateData).where(eq(products.id, id));
    return this.getById(id);
  }

  async delete(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }
}
