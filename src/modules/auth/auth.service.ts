import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword, comparePassword } from '../../shared/utils/hash.util.js';
import { type RegisterBody, type LoginBody } from './auth.schema.js';

/**
 * Service for authentication-related operations.
 * Handles user registration, login validation, token management, and password changes.
 */
export class AuthService {
  /**
   * Register a new user.
   * @param data - Registration data (email, password, name, address?, phone_number?)
   * @returns Created user object with ULID
   */
  async register(data: RegisterBody) {
    const id = ulid();
    const hashedPassword = await hashPassword(data.password);
    
    await db.insert(users).values({
      id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      address: data.address,
      phoneNumber: data.phone_number,
    });

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return {
      ...user!,
      phone_number: user!.phoneNumber,
      created_at: user!.createdAt,
      updated_at: user!.updatedAt,
    };
  }

  /**
   * Validate user credentials for login.
   * @param data - Login data (email, password)
   * @returns User object if valid, null if invalid
   */
  async validateUser(data: LoginBody) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!user) return null;

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) return null;

    return user;
  }

  /**
   * Update refresh token in database.
   * @param userId - User ULID
   * @param token - New refresh token or null to clear
   */
  async updateRefreshToken(userId: string, token: string | null) {
    await db.update(users).set({ refreshToken: token }).where(eq(users.id, userId));
  }

  /**
   * Find user by refresh token.
   * @param token - Refresh token to search
   * @returns User object if found, null otherwise
   */
  async findByRefreshToken(token: string) {
    const [user] = await db.select().from(users).where(eq(users.refreshToken, token)).limit(1);
    return user;
  }

  /**
   * Change user password after validating old password.
   * @param userId - User ULID
   * @param oldPass - Current password to verify
   * @param newPass - New password to set
   * @throws Error if user not found or old password is invalid
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(oldPass, user.password);
    if (!isValid) throw new Error('Invalid old password');

    const hashedPassword = await hashPassword(newPass);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
}
