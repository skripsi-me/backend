import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

export const CartItemSchema = Type.Object({
  id: Type.String({ description: 'Cart item ULID' }),
  cart_id: Type.String({ description: 'Cart ULID' }),
  product_id: Type.String({ description: 'Product ULID' }),
  quantity: Type.Number({ description: 'Quantity of the product in the cart' }),
  product: Type.Optional(Type.Object({
    name: Type.String({ description: 'Product name' }),
    price: Type.String({ description: 'Product price' }),
    image_url: Type.Union([Type.String(), Type.Null()], { description: 'Product image URL' }),
  })),
});

export const CartSchema = Type.Object({
  id: Type.String({ description: 'Cart ULID' }),
  user_id: Type.String({ description: 'User ULID' }),
  items: Type.Array(CartItemSchema, { description: 'List of items in the cart' }),
});

export const GetCartSchema = {
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

export const AddToCartSchema = {
  body: Type.Object({
    product_id: Type.String({ description: 'Product ULID to add' }),
    quantity: Type.Number({ minimum: 1, description: 'Quantity to add' }),
  }),
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

export const UpdateCartItemSchema = {
  params: Type.Object({
    item_id: Type.String({ description: 'Cart item ULID' }),
  }),
  body: Type.Object({
    quantity: Type.Number({ minimum: 1, description: 'New quantity' }),
  }),
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

export const RemoveCartItemSchema = {
  params: Type.Object({
    item_id: Type.String({ description: 'Cart item ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

export type AddToCartBody = Static<typeof AddToCartSchema.body>;
export type UpdateCartItemBody = Static<typeof UpdateCartItemSchema.body>;
export type Cart = Static<typeof CartSchema>;
