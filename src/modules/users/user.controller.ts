import { type FastifyReply, type FastifyRequest } from 'fastify';
import { UserService } from './user.service.js';
import { type CreateUserBody, type UpdateUserBody, type UpdateProfileBody } from './user.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class UserController {
  constructor(private userService: UserService) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    const users = await this.userService.getAll();
    return reply.success(users, 'Users retrieved successfully');
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await this.userService.getById(request.params.id);
    if (!user) {
      return reply.status(404).send(formatError(404, 'User not found'));
    }
    return reply.success(user, 'User retrieved successfully');
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.userService.getById(request.user.id);
    return reply.success(user, 'Profile retrieved successfully');
  }

  async create(request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) {
    const existing = await this.userService.findByEmail(request.body.email);
    if (existing) {
      return reply.status(409).send(formatError(409, 'Email already exists'));
    }
    const user = await this.userService.create(request.body);
    return reply.status(201).success(user, 'User created successfully');
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserBody }>, reply: FastifyReply) {
    const user = await this.userService.update(request.params.id, request.body);
    if (!user) {
      return reply.status(404).send(formatError(404, 'User not found'));
    }
    return reply.success(user, 'User updated successfully');
  }

  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) {
    const user = await this.userService.updateProfile(request.user.id, request.body);
    return reply.success(user, 'Profile updated successfully');
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await this.userService.delete(request.params.id);
    return reply.status(204).send();
  }
}
