import { Type, type Static } from '@sinclair/typebox';
import { createStandardResponseSchema } from '../../shared/utils/response.util.js';

/** Schema for a single cart item */
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

/** Schema for cart with items */
export const CartSchema = Type.Object({
  id: Type.String({ description: 'Cart ULID' }),
  user_id: Type.String({ description: 'User ULID' }),
  items: Type.Array(CartItemSchema, { description: 'List of items in the cart' }),
});

/** Schema for getting the authenticated user's cart */
export const GetCartSchema = {
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

/** Schema for adding an item to the cart */
export const AddToCartSchema = {
  body: Type.Object({
    product_id: Type.String({ description: 'Product ULID to add' }),
    quantity: Type.Number({ minimum: 1, description: 'Quantity to add' }),
  }),
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

/** Schema for updating cart item quantity */
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

/** Schema for removing an item from the cart */
export const RemoveCartItemSchema = {
  params: Type.Object({
    item_id: Type.String({ description: 'Cart item ULID' }),
  }),
  response: {
    200: createStandardResponseSchema(CartSchema),
  },
};

/** TypeScript type for add to cart request body */
export type AddToCartBody = Static<typeof AddToCartSchema.body>;
/** TypeScript type for update cart item request body */
export type UpdateCartItemBody = Static<typeof UpdateCartItemSchema.body>;
/** TypeScript type for cart object */
export type Cart = Static<typeof CartSchema>;
