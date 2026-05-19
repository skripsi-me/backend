import { type FastifyReply, type FastifyRequest } from 'fastify';
import { AuthService } from './auth.service.js';
import { type RegisterBody, type LoginBody, type ChangePasswordBody } from './auth.schema.js';
import { formatError } from '../../shared/utils/response.util.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
    const user = await this.authService.register(request.body);
    return reply.status(201).success(user, 'User registered successfully');
  }

  async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    const user = await this.authService.validateUser(request.body);
    if (!user) {
      return reply.status(401).send(formatError(401, 'Invalid credentials'));
    }

    const accessToken = await reply.jwtSign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' }
    );

    const refreshToken = await reply.jwtSign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    ) as string;

    await this.authService.updateRefreshToken(user.id, refreshToken);

    return reply
      .setCookie('token', accessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        signed: true,
      })
      .setCookie('refresh_token', refreshToken, {
        path: '/api/auth/refresh',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        signed: true,
      })
      .success({ status: 'ok' }, 'Login successful');
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const { refresh_token: refreshToken } = request.cookies;
    if (!refreshToken) {
      return reply.status(401).send(formatError(401, 'Refresh token missing'));
    }

    const { value: token } = reply.unsignCookie(refreshToken);
    if (!token) {
      return reply.status(401).send(formatError(401, 'Invalid refresh token signature'));
    }

    const user = await this.authService.findByRefreshToken(token);
    if (!user) {
      return reply.status(401).send(formatError(401, 'Session expired or invalid'));
    }

    const newAccessToken = await reply.jwtSign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '15m' }
    );

    return reply
      .setCookie('token', newAccessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        signed: true,
      })
      .success({ status: 'ok' }, 'Token refreshed');
  }

  async changePassword(request: FastifyRequest<{ Body: ChangePasswordBody }>, reply: FastifyReply) {
    const userId = request.user.id;
    try {
      await this.authService.changePassword(userId, request.body.old_password, request.body.new_password);
      return reply.success({ status: 'ok' }, 'Password changed successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      return reply.status(400).send(formatError(400, message));
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (userId) {
      await this.authService.updateRefreshToken(userId, null);
    }

    return reply
      .clearCookie('token', { path: '/' })
      .clearCookie('refresh_token', { path: '/api/auth/refresh' })
      .success({ status: 'ok' }, 'Logged out successfully');
  }
}
