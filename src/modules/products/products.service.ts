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

    if (query.category_id) {
      const catFilter = eq(products.categoryId, query.category_id);
      whereClause = whereClause ? and(whereClause, catFilter) : catFilter;
    }

    const [data, totalResult] = await Promise.all([
      db.select({
        id: products.id,
        category_id: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        image_url: products.imageUrl,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      }).from(products).where(whereClause).limit(limit).offset(offset),
      db.select({ value: count() }).from(products).where(whereClause)
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages,
      },
    };
  }

  async getById(id: string) {
    const [product] = await db.select({
      id: products.id,
      category_id: products.categoryId,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      image_url: products.imageUrl,
      created_at: products.createdAt,
      updated_at: products.updatedAt,
    }).from(products).where(eq(products.id, id)).limit(1);
    return product;
  }

  async getBySlug(slug: string) {
    const [product] = await db.select({
      id: products.id,
      category_id: products.categoryId,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      image_url: products.imageUrl,
      created_at: products.createdAt,
      updated_at: products.updatedAt,
    }).from(products).where(eq(products.slug, slug)).limit(1);
    return product;
  }

  async listByCategorySlug(categorySlug: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      db.select({
        id: products.id,
        category_id: products.categoryId,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        image_url: products.imageUrl,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
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
    const total_pages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, total_pages },
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
      categoryId: data.category_id,
      imageUrl: imageUrl || data.image_url,
    });

    return this.getById(id);
  }

  async update(id: string, data: any, file?: { buffer: Buffer; filename: string }) {
    const updateData: any = { ...data };
    
    if (data.stock) updateData.stock = parseInt(data.stock);

    if (file) {
      updateData.imageUrl = await uploadImage(file.buffer, `${id}_${file.filename}`);
    } else if (data.image_url) {
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

  async delete(id: string) {
    await db.delete(products).where(eq(products.id, id));
    return { success: true };
  }
}
