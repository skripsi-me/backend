import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { 
  GetUsersSchema,
  GetUserSchema,
  GetProfileSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UpdateProfileSchema,
  DeleteUserSchema
} from './user.schema.js';

export const userRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const userService = new UserService();
  const userController = new UserController(userService);

  provider.addHook('onRequest', fastify.authenticate);

  // Profile routes
  provider.get('/me', { 
    schema: {
      ...GetProfileSchema,
      tags: ['Users'],
      summary: 'Get current user profile',
      description: 'Returns the profile of the currently authenticated user.',
      security: [{ bearerAuth: [] }]
    } 
  }, userController.me.bind(userController));

  provider.patch('/me', { 
    schema: {
      ...UpdateProfileSchema,
      tags: ['Users'],
      summary: 'Update current user profile',
      description: 'Updates the profile of the currently authenticated user.',
      security: [{ bearerAuth: [] }]
    } 
  }, userController.updateProfile.bind(userController));

  // Admin only routes
  provider.get('/', {
    schema: {
      ...GetUsersSchema,
      tags: ['Users'],
      summary: 'Get all users (Admin)',
      description: 'Returns a list of all users. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, userController.getAll.bind(userController));

  provider.get('/:id', {
    schema: {
      ...GetUserSchema,
      tags: ['Users'],
      summary: 'Get user by ID (Admin)',
      description: 'Returns a user by their ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, userController.getById.bind(userController));

  provider.post('/', {
    schema: {
      ...CreateUserSchema,
      tags: ['Users'],
      summary: 'Create new user (Admin)',
      description: 'Creates a new user account. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, userController.create.bind(userController));

  provider.patch('/:id', {
    schema: {
      ...UpdateUserSchema,
      tags: ['Users'],
      summary: 'Update user (Admin)',
      description: 'Updates a user account by their ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, userController.update.bind(userController));

  provider.delete('/:id', {
    schema: {
      ...DeleteUserSchema,
      tags: ['Users'],
      summary: 'Delete user (Admin)',
      description: 'Deletes a user account by their ULID. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, userController.delete.bind(userController));
};
