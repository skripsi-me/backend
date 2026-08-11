import { db } from '../../config/database.js';
import { categories } from '../../db/schema.js';
import { eq, like } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { sanitize } from '../../shared/utils/sanitize.util.js';
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
   * Get category by slug.
   * @param slug - Category slug
   * @returns Category object or undefined if not found
   */
  async getBySlug(slug: string) {
    const [category] = await db.select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      created_at: categories.createdAt,
      updated_at: categories.updatedAt,
    }).from(categories).where(eq(categories.slug, slug)).limit(1);
    return category;
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
   * @param data - Category data (name, description?)
   * @returns Created category object
   */
  async create(data: CreateCategoryBody) {
    const id = ulid();
    const slug = await this.generateSlug(data.name);
    await db.insert(categories).values({
      id,
      name: sanitize(data.name),
      slug,
      description: data.description ? sanitize(data.description) : null,
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
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const existing = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(like(categories.slug, `${slug}%`));

    if (existing.length === 0) return slug;

    let counter = 1;
    while (existing.some((e) => e.slug === `${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }

  /**
   * Update category by ID.
   * @param id - Category ULID
   * @param data - Partial category data to update (name, description)
   * @returns Updated category object
   */
  async update(id: string, data: UpdateCategoryBody) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
      updateData.name = sanitize(data.name);
      updateData.slug = await this.generateSlug(data.name);
    }
    if (data.description !== undefined) {
      updateData.description = data.description ? sanitize(data.description) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getById(id);
    }

    await db.update(categories).set(updateData).where(eq(categories.id, id));
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
