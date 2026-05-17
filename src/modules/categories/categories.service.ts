import { db } from '../../config/database.js';
import { categories } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type CreateCategoryBody, type UpdateCategoryBody } from './categories.schema.js';

export class CategoriesService {
  async getAll() {
    return db.select().from(categories);
  }

  async getById(id: string) {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
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
