import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';
import { PaginationQuerySchema, PaginationMetaSchema } from '../../shared/schemas/pagination.schema.js';

/** Schema for a single order item */
export const OrderItemSchema = Type.Object({
  id: Type.String({ description: 'Order item ULID' }),
  order_id: Type.String({ description: 'Order ULID' }),
  product_id: Type.String({ description: 'Product ULID' }),
  quantity: Type.Number({ description: 'Quantity purchased' }),
  price_at_purchase: Type.String({ description: 'Price per unit at the time of purchase' }),
  product: Type.Optional(Type.Object({
    name: Type.String({ description: 'Product name' }),
  })),
});

/** Schema for order object */
export const OrderSchema = Type.Object({
  id: Type.String({ description: 'Order ULID' }),
  user_id: Type.String({ description: 'User ULID who placed the order' }),
  total_amount: Type.String({ description: 'Total order amount' }),
  status: Type.String({ description: 'Order status (pending, shipped, delivered, cancelled)' }),
  created_at: Type.Any({ description: 'Order creation timestamp' }),
  items: Type.Optional(Type.Array(OrderItemSchema, { description: 'List of items in the order' })),
});

/** Schema for listing orders (admin sees all, user sees own) */
export const ListOrdersSchema = {
  query: PaginationQuerySchema,
  response: {
    200: createStandardResponseSchema(Type.Object({
      data: Type.Array(OrderSchema),
      meta: PaginationMetaSchema,
    })),
  },
};

/** Schema for getting a single order by ID */
export const GetOrderSchema = {
  params: Type.Object({
    id: Type.String({ description: 'Order ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(OrderSchema),
  },
};

/** Schema for creating an order from cart (checkout) */
export const CreateOrderSchema = {
  response: {
    201: createStandardResponseSchema(OrderSchema),
  },
};

/** Schema for updating order status (admin only) */
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

/** Schema for order report entry */
export const OrderReportSchema = Type.Object({
  date: Type.String({ description: 'Date in YYYY-MM-DD format' }),
  total_amount: Type.Number({ description: 'Total order amount for this date' }),
  order_count: Type.Number({ description: 'Number of orders for this date' }),
});

/** Schema for getting order report (admin only) */
export const GetOrderReportSchema = {
  query: Type.Object({
    start_date: Type.Optional(Type.String({ format: 'date', description: 'Start date (YYYY-MM-DD)' })),
    end_date: Type.Optional(Type.String({ format: 'date', description: 'End date (YYYY-MM-DD)' })),
  }),
  response: {
    200: createStandardResponseSchema(Type.Array(OrderReportSchema)),
  },
};

/** TypeScript type for update order status request body */
export type UpdateOrderStatusBody = Static<typeof UpdateOrderStatusSchema.body>;
/** TypeScript type for order report query parameters */
export type GetOrderReportQuery = Static<typeof GetOrderReportSchema.query>;
