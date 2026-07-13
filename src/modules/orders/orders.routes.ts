import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { 
  UpdateOrderStatusSchema,
  CreateOrderSchema,
  ListOrdersSchema,
  GetOrderSchema,
  GetOrderReportSchema
} from './orders.schema.js';

export const ordersRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const ordersService = new OrdersService();
  const ordersController = new OrdersController(ordersService);

  provider.addHook('onRequest', fastify.authenticate);

  provider.get('/report', {
    schema: {
      ...GetOrderReportSchema,
      tags: ['Orders'],
      summary: 'Get order report for chart (Admin)',
      description: 'Returns aggregated order data grouped by date for a given range. Defaults to current month.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, ordersController.getReport.bind(ordersController) as any);

  provider.post('/', { 
    schema: {
      ...CreateOrderSchema,
      tags: ['Orders'],
      summary: 'Create order from cart',
      description: 'Creates a new order using the items currently in the user shopping cart.',
      security: [{ bearerAuth: [] }]
    } 
  }, ordersController.create.bind(ordersController) as any);

  provider.get('/me', { 
    schema: {
      ...ListOrdersSchema,
      tags: ['Orders'],
      summary: 'Get current user orders',
      description: 'Returns a list of orders placed by the currently authenticated user.',
      security: [{ bearerAuth: [] }]
    } 
  }, ordersController.listMine.bind(ordersController) as any);

  provider.get('/:id', { 
    schema: {
      ...GetOrderSchema,
      tags: ['Orders'],
      summary: 'Get order by ID',
      description: 'Returns details of a specific order by its ULID.',
      security: [{ bearerAuth: [] }]
    } 
  }, ordersController.getById.bind(ordersController) as any);

  // Admin/Courier routes
  provider.get('/', {
    schema: {
      ...ListOrdersSchema,
      tags: ['Orders'],
      summary: 'List all orders (Admin)',
      description: 'Returns a list of all orders in the system. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, ordersController.listAll.bind(ordersController) as any);

  provider.patch('/:id/status', {
    schema: {
      ...UpdateOrderStatusSchema,
      tags: ['Orders'],
      summary: 'Update order status (Admin)',
      description: 'Updates the status of an order. Required admin privileges.',
      security: [{ bearerAuth: [] }]
    },
    onRequest: [fastify.adminOnly],
  }, ordersController.updateStatus.bind(ordersController) as any);
};
