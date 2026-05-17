import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

export const OrderItemSchema = Type.Object({
  id: Type.String({ description: 'Order item ULID' }),
  orderId: Type.String({ description: 'Order ULID' }),
  productId: Type.String({ description: 'Product ULID' }),
  quantity: Type.Number({ description: 'Quantity purchased' }),
  priceAtPurchase: Type.String({ description: 'Price per unit at the time of purchase' }),
  product: Type.Optional(Type.Object({
    name: Type.String({ description: 'Product name' }),
  })),
});

export const OrderSchema = Type.Object({
  id: Type.String({ description: 'Order ULID' }),
  userId: Type.String({ description: 'User ULID who placed the order' }),
  totalAmount: Type.String({ description: 'Total order amount' }),
  status: Type.String({ description: 'Order status (pending, shipped, delivered, cancelled)' }),
  createdAt: Type.Any({ description: 'Order creation timestamp' }),
  items: Type.Optional(Type.Array(OrderItemSchema, { description: 'List of items in the order' })),
});

export const ListOrdersSchema = {
  response: {
    200: createStandardResponseSchema(Type.Array(OrderSchema)),
  },
};

export const GetOrderSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Order ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(OrderSchema),
  },
};

export const CreateOrderSchema = {
  response: {
    201: createStandardResponseSchema(OrderSchema),
  },
};

export const UpdateOrderStatusSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Order ULID' }),
  }),
  body: Type.Object({
    status: Type.Union([
      Type.Literal('pending'),
      Type.Literal('shipped'),
      Type.Literal('delivered'),
      Type.Literal('cancelled'),
    ], { description: 'New order status' }),
  }),
  response: {
    200: createStandardResponseSchema(OrderSchema),
  },
};

export type UpdateOrderStatusBody = Static<typeof UpdateOrderStatusSchema.body>;
