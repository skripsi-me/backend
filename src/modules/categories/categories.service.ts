import { db } from '../../config/database.js';
import { categories } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type CreateCategoryBody, type UpdateCategoryBody } from './categories.schema.js';

export class CategoriesService {
  async getAll() {
    return db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      created_at: categories.createdAt,
      updated_at: categories.updatedAt,
    }).from(categories);
  }

  async getById(id: string) {
    const [category] = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      created_at: categories.createdAt,
      updated_at: categories.updatedAt,
    }).from(categories).where(eq(categories.id, id)).limit(1);
    return category;
  }

  async create(data: CreateCategoryBody) {
    const id = ulid();
    await db.insert(categories).values({
      id,
      name: data.name,
      slug: data.slug,
      description: data.description,
    });
    return this.getById(id);
  }

  async update(id: string, data: UpdateCategoryBody) {
    await db.update(categories).set(data).where(eq(categories.id, id));
    return this.getById(id);
  }

  async delete(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
    return { success: true };
  }
}
