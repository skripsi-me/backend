import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword, comparePassword } from '../../shared/utils/hash.util.js';
import { type RegisterBody, type LoginBody } from './auth.schema.js';

export class AuthService {
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

  async validateUser(data: LoginBody) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!user) return null;

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) return null;

    return user;
  }

  async updateRefreshToken(userId: string, token: string | null) {
    await db.update(users).set({ refreshToken: token }).where(eq(users.id, userId));
  }

  async findByRefreshToken(token: string) {
    const [user] = await db.select().from(users).where(eq(users.refreshToken, token)).limit(1);
    return user;
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(oldPass, user.password);
    if (!isValid) throw new Error('Invalid old password');

    const hashedPassword = await hashPassword(newPass);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }
}
