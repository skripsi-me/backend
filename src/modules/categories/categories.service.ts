import { db } from '../../config/database.js';
import { categories } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { type CreateCategoryBody, type UpdateCategoryBody } from './categories.schema.js';

/**
 * Service for category management operations.
 * Handles CRUD operations for product categories.
 */
export class CategoriesService {
  /**
   * Get all categories.
   * @returns Array of category objects
   */
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

  /**
   * Get category by ID.
   * @param id - Category ULID
   * @returns Category object or undefined if not found
   */
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

  /**
   * Create a new category.
   * @param data - Category data (name, slug, description?)
   * @returns Created category object
   */
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

  /**
   * Update category by ID.
   * @param id - Category ULID
   * @param data - Partial category data to update
   * @returns Updated category object
   */
  async update(id: string, data: UpdateCategoryBody) {
    await db.update(categories).set(data).where(eq(categories.id, id));
    return this.getById(id);
  }

  /**
   * Delete category by ID.
   * @param id - Category ULID
   * @returns Success object
   */
  async delete(id: string) {
    await db.delete(categories).where(eq(categories.id, id));
    return { success: true };
  }
}
