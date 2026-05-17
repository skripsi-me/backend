import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { 
  RegisterSchema, 
  LoginSchema, 
  ChangePasswordSchema, 
  RefreshTokenSchema,
  LogoutSchema 
} from './auth.schema.js';

export const authRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const authService = new AuthService();
  const authController = new AuthController(authService);

  provider.post('/register', { 
    schema: {
      ...RegisterSchema,
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Creates a new user account with the provided details.'
    } 
  }, authController.register.bind(authController));

  provider.post('/login', { 
    schema: {
      ...LoginSchema,
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticates a user and sets session cookies.'
    } 
  }, authController.login.bind(authController));

  provider.post('/refresh', { 
    schema: {
      ...RefreshTokenSchema,
      tags: ['Auth'],
      summary: 'Refresh session',
      description: 'Refreshes the access token using the refresh token from cookies.'
    } 
  }, authController.refreshToken.bind(authController));

  provider.post('/logout', { 
    schema: {
      ...LogoutSchema,
      tags: ['Auth'],
      summary: 'User logout',
      description: 'Clears user session cookies.'
    } 
  }, authController.logout.bind(authController));
  
  provider.post('/change-password', {
    onRequest: [fastify.authenticate],
    schema: {
      ...ChangePasswordSchema,
      tags: ['Auth'],
      summary: 'Change password',
      description: 'Updates the password for the currently authenticated user.',
      security: [{ bearerAuth: [] }]
    },
  }, authController.changePassword.bind(authController));
};
