import { type FastifyReply, type FastifyRequest } from 'fastify';
import { UserService } from './user.service.js';
import {
  type CreateUserBody,
  type UpdateUserBody,
  type UpdateProfileBody,
  type ListUsersQuery,
} from './user.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

/**
 * Controller for user management endpoints.
 * Handles profile retrieval, profile updates, and admin CRUD operations.
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get all users (admin only).
   * @param request - Fastify request
   * @param reply - Fastify reply
   * @returns 200 with array of users
   */
  async getAll(request: FastifyRequest<{ Querystring: ListUsersQuery }>, reply: FastifyReply) {
    const result = await this.userService.getAll(request.query);
    return reply.success(result, 'Users retrieved successfully');
  }

  /**
   * Get user by ID (admin only).
   * @param request - Fastify request with user ID param
   * @param reply - Fastify reply
   * @returns 200 with user or 404 if not found
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = await this.userService.getById(request.params.id);
    if (!user) {
      return reply.status(404).send(formatError(404, 'User not found'));
    }
    return reply.success(user, 'User retrieved successfully');
  }

  /**
   * Get authenticated user's profile.
   * @param request - Fastify request (uses request.user.id)
   * @param reply - Fastify reply
   * @returns 200 with user profile
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.userService.getById(request.user.id);
    return reply.success(user, 'Profile retrieved successfully');
  }

  /**
   * Create a new user (admin only).
   * @param request - Fastify request with CreateUserBody
   * @param reply - Fastify reply
   * @returns 201 with created user or 409 if email exists
   */
  async create(request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) {
    const existing = await this.userService.findByEmail(request.body.email);
    if (existing) {
      return reply.status(409).send(formatError(409, 'Email already exists'));
    }
    const user = await this.userService.create(request.body);
    return reply.status(201).success(user, 'User created successfully');
  }

  /**
   * Update user by ID (admin only).
   * @param request - Fastify request with user ID and UpdateUserBody
   * @param reply - Fastify reply
   * @returns 200 with updated user or 404 if not found
   */
  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserBody }>,
    reply: FastifyReply,
  ) {
    const user = await this.userService.update(request.params.id, request.body);
    if (!user) {
      return reply.status(404).send(formatError(404, 'User not found'));
    }
    return reply.success(user, 'User updated successfully');
  }

  /**
   * Update authenticated user's profile.
   * @param request - Fastify request with UpdateProfileBody
   * @param reply - Fastify reply
   * @returns 200 with updated profile
   */
  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) {
    const user = await this.userService.updateProfile(request.user.id, request.body);
    return reply.success(user, 'Profile updated successfully');
  }

  /**
   * Delete user by ID (admin only).
   * @param request - Fastify request with user ID param
   * @param reply - Fastify reply
   * @returns 200 with success status
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.userService.delete(request.params.id);
    return reply.success(result);
  }
}
