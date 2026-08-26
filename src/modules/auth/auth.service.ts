import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { createHash } from 'crypto';
import { hashPassword, comparePassword } from '../../shared/utils/hash.util.js';
import { sanitize } from '../../shared/utils/sanitize.util.js';
import { type RegisterBody, type LoginBody } from './auth.schema.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

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
      name: sanitize(data.name),
      address: data.address ? sanitize(data.address) : null,
      phoneNumber: data.phone_number,
      role: data.role || 'user',
    });

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new Error('Pendaftaran gagal. Silakan coba lagi.');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      address: user.address,
      phone_number: user.phoneNumber,
      role: user.role,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
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
   * Update refresh token in database. Rotates hash chain (current + prev)
   * so parallel refreshes and short replay windows converge.
   * @param userId - User ULID
   * @param token - New refresh token or null to clear
   */
  async updateRefreshToken(userId: string, token: string | null) {
    const hash = token ? hashToken(token) : null;

    if (hash === null) {
      await db.update(users)
        .set({ refreshTokenHash: null, refreshTokenHashPrev: null })
        .where(eq(users.id, userId));
      return;
    }

    const [user] = await db
      .select({ refreshTokenHash: users.refreshTokenHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db.update(users)
      .set({
        refreshTokenHash: hash,
        refreshTokenHashPrev: user?.refreshTokenHash ?? null,
      })
      .where(eq(users.id, userId));
  }

  /**
   * Find user by refresh token hash (current or previous generation).
   * @param token - Refresh token to search
   * @returns User object if found, null otherwise
   */
  async findByRefreshToken(token: string) {
    const hash = hashToken(token);
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(
        or(
          eq(users.refreshTokenHash, hash),
          eq(users.refreshTokenHashPrev, hash),
        ),
      )
      .limit(1);
    return user;
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

  /**
   * Change user password after validating old password.
   * @param userId - User ULID
   * @param oldPass - Current password to verify
   * @param newPass - New password to set
   * @throws Error if user not found or old password is invalid
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const isValid = await comparePassword(oldPass, user.password);
    if (!isValid) throw new Error('Password lama salah. Periksa kembali password Anda.');

    const hashedPassword = await hashPassword(newPass);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
}
