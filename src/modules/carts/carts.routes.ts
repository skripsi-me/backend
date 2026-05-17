import { type FastifyInstance } from 'fastify';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { CartsController } from './carts.controller.js';
import { CartsService } from './carts.service.js';
import { 
  AddToCartSchema, 
  UpdateCartItemSchema,
  GetCartSchema,
  RemoveCartItemSchema
} from './carts.schema.js';

export const cartsRoutes = async (fastify: FastifyInstance) => {
  const provider = fastify.withTypeProvider<TypeBoxTypeProvider>();
  const cartsService = new CartsService();
  const cartsController = new CartsController(cartsService);

  provider.addHook('onRequest', fastify.authenticate);

  provider.get('/', { 
    schema: {
      ...GetCartSchema,
      tags: ['Carts'],
      summary: 'Get current user cart',
      description: 'Returns the shopping cart for the currently authenticated user.',
      security: [{ bearerAuth: [] }]
    } 
  }, cartsController.getCart.bind(cartsController));

  provider.post('/items', { 
    schema: {
      ...AddToCartSchema,
      tags: ['Carts'],
      summary: 'Add item to cart',
      description: 'Adds a product to the user shopping cart.',
      security: [{ bearerAuth: [] }]
    } 
  }, cartsController.addItem.bind(cartsController));

  provider.put('/items/:itemId', { 
    schema: {
      ...UpdateCartItemSchema,
      tags: ['Carts'],
      summary: 'Update cart item quantity',
      description: 'Updates the quantity of a specific item in the shopping cart.',
      security: [{ bearerAuth: [] }]
    } 
  }, cartsController.updateItem.bind(cartsController));

  provider.delete('/items/:itemId', { 
    schema: {
      ...RemoveCartItemSchema,
      tags: ['Carts'],
      summary: 'Remove item from cart',
      description: 'Removes a specific item from the shopping cart.',
      security: [{ bearerAuth: [] }]
    } 
  }, cartsController.removeItem.bind(cartsController));
};

