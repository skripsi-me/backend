import { db } from '../../config/database.js';
import { users } from '../../db/schema.js';
import { eq, ne, and } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { hashPassword } from '../../shared/utils/hash.util.js';
import { type CreateUserBody, type UpdateUserBody, type UpdateProfileBody } from './user.schema.js';

export class UserService {
  async getAll() {
    return db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      address: users.address,
      phone_number: users.phoneNumber,
      role: users.role,
    }).from(users);
  }

  async getById(id: string) {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      address: users.address,
      phone_number: users.phoneNumber,
      role: users.role,
    }).from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async create(data: CreateUserBody) {
    const id = ulid();
    const hashedPassword = await hashPassword(data.password);
    
    await db.insert(users).values({
      id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      address: data.address,
      phoneNumber: data.phone_number,
      role: data.role || 'user',
    });

    return this.getById(id);
  }

  async update(id: string, data: UpdateUserBody) {
    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    if (data.phone_number) {
      updateData.phoneNumber = data.phone_number;
      delete updateData.phone_number;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));
    return this.getById(id);
  }

  async updateProfile(id: string, data: UpdateProfileBody) {
    const updateData: any = { ...data };
    if (data.phone_number) {
      updateData.phoneNumber = data.phone_number;
      delete updateData.phone_number;
    }
    await db.update(users).set(updateData).where(eq(users.id, id));
    return this.getById(id);
  }

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }
}
