import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq, count, asc, desc } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../shared/utils/hash.util.js';
import { sanitize } from '../../shared/utils/sanitize.util.js';
import {
  type CreateUserBody,
  type UpdateUserBody,
  type UpdateProfileBody,
  type ListUsersQuery,
} from './user.schema.js';

/**
 * Service for user management operations.
 * Handles CRUD operations for users and profile management.
 */
export class UserService {
  /**
   * Get all users (admin only).
   * @returns Array of user objects
   */
  async getAll(query: ListUsersQuery = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    const orderBy = query.sort === 'asc' ? asc(users.createdAt) : desc(users.createdAt);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          address: users.address,
          phone_number: users.phoneNumber,
          role: users.role,
        })
        .from(users)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(users),
    ]);

    const total = totalResult[0]?.value || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, total_pages },
    };
  }

  /**
   * Get user by ID.
   * @param id - User ULID
   * @returns User object or undefined if not found
   */
  async getById(id: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        address: users.address,
        phone_number: users.phoneNumber,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  /**
   * Create a new user.
   * @param data - User data (email, password, name, address?, phone_number?, role?)
   * @returns Created user object
   */
  async create(data: CreateUserBody) {
    const id = ulid();
    const hashedPassword = await hashPassword(data.password);

    await db.insert(users).values({
      id,
      email: data.email,
      password: hashedPassword,
      name: sanitize(data.name),
      address: data.address ? sanitize(data.address) : null,
      phoneNumber: data.phone_number,
      role: data.role || 'user',
    });

    return this.getById(id);
  }

  /**
   * Update user by ID (admin only).
   * @param id - User ULID
   * @param data - Partial user data to update
   * @returns Updated user object
   */
  async update(id: string, data: UpdateUserBody) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    if (data.name !== undefined) {
      updateData.name = sanitize(data.name);
    }

    if (data.address !== undefined) {
      updateData.address = data.address ? sanitize(data.address) : null;
    }

    if (data.phone_number !== undefined) {
      updateData.phoneNumber = data.phone_number || null;
      delete updateData.phone_number;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getById(id);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
    return this.getById(id);
  }

  /**
   * Update authenticated user's profile.
   * @param id - User ULID
   * @param data - Partial profile data (name, address, phone_number)
   * @returns Updated user object
   */
  async updateProfile(id: string, data: UpdateProfileBody) {
    const updateData: any = { ...data };

    if (data.name !== undefined) {
      updateData.name = sanitize(data.name);
    }

    if (data.address !== undefined) {
      updateData.address = data.address ? sanitize(data.address) : null;
    }

    if (data.phone_number !== undefined) {
      updateData.phoneNumber = data.phone_number || null;
      delete updateData.phone_number;
    }

    if (Object.keys(updateData).length === 0) {
      return this.getById(id);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
    return this.getById(id);
  }

  /**
   * Delete user by ID.
   * @param id - User ULID
   */
  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  }

  /**
   * Find user by email.
   * @param email - Email to search
   * @returns User object if found, undefined otherwise
   */
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }
}
