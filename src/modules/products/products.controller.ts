import { type FastifyReply, type FastifyRequest } from 'fastify';
import { type ProductsService } from './products.service.js';
import { type ListProductsQuery, type GetBestSellersQuery } from './products.schema.js';
import { formatError } from '../../shared/utils/response.util.js';
import { uploadImage } from '../../shared/utils/imagekit.util.js';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function extractBodyFields(body: any): Record<string, any> {
  if (!body) return {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === 'image') continue;
    if (typeof value === 'object' && value !== null && 'value' in (value as any)) {
      result[key] = (value as any).value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function processImageUpload(request: FastifyRequest): Promise<string | undefined> {
  if (!request.isMultipart()) return undefined;

  const bodyField = (request.body as any)?.image;
  if (!bodyField || typeof bodyField.mimetype !== 'string') return undefined;

  if (!ALLOWED_MIMES.includes(bodyField.mimetype)) {
    throw new Error(
      `Tipe file tidak valid: ${bodyField.mimetype}. Tipe yang diizinkan: ${ALLOWED_MIMES.join(', ')}.`,
    );
  }

  const buffer = await bodyField.toBuffer();
  return uploadImage(buffer, bodyField.filename);
}

/**
 * Controller for product management endpoints.
 * Handles listing, searching, creating, updating, and deleting products.
 */
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * Get best seller products (public).
   * @param request - Fastify request with optional limit query
   * @param reply - Fastify reply
   * @returns 200 with array of best seller products
   */
  async getBestSellers(
    request: FastifyRequest<{ Querystring: GetBestSellersQuery }>,
    reply: FastifyReply,
  ) {
    const products = await this.productsService.getBestSellers(request.query);
    return reply.success(products);
  }

  /**
   * List products with pagination, search, and category filter (public).
   * @param request - Fastify request with ListProductsQuery
   * @param reply - Fastify reply
   * @returns 200 with paginated products
   */
  async list(request: FastifyRequest<{ Querystring: ListProductsQuery }>, reply: FastifyReply) {
    const result = await this.productsService.list(request.query);
    return reply.success(result);
  }

  /**
   * Get product by ID (admin only).
   * @param request - Fastify request with product ID param
   * @param reply - Fastify reply
   * @returns 200 with product or 404 if not found
   */
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getById(request.params.id);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Produk tidak ditemukan.'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  /**
   * Get product by slug (public).
   * @param request - Fastify request with slug param
   * @param reply - Fastify reply
   * @returns 200 with product or 404 if not found
   */
  async getBySlug(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const product = await this.productsService.getBySlug(request.params.slug);
    if (!product) {
      return reply.status(404).send(formatError(404, 'Produk tidak ditemukan.'));
    }
    return reply.success(product, 'Product retrieved successfully');
  }

  /**
   * List products by category slug (public).
   * @param request - Fastify request with category_slug param and pagination query
   * @param reply - Fastify reply
   * @returns 200 with paginated products
   */
  async listByCategorySlug(
    request: FastifyRequest<{
      Params: { categorySlug: string };
      Querystring: { page?: number; limit?: number; sort?: 'asc' | 'desc' };
    }>,
    reply: FastifyReply,
  ) {
    try {
      const result = await this.productsService.listByCategorySlug(
        request.params.categorySlug,
        request.query,
      );
      return reply.success(result, 'Products retrieved successfully');
    } catch (err) {
      if (err instanceof Error && err.message === 'Kategori tidak ditemukan.') {
        return reply.status(404).send(formatError(404, 'Kategori tidak ditemukan.'));
      }
      throw err;
    }
  }

  /**
   * Create a new product (admin only).
   * @param request - Fastify request with CreateProductBody
   * @param reply - Fastify reply
   * @returns 201 with created product
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const imageUrl = await processImageUpload(request);
      const body = extractBodyFields(request.body);

      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const price = Number(body.price);
      const stock = Number(body.stock);
      const categoryId = typeof body.category_id === 'string' ? body.category_id.trim() : '';

      if (
        !name ||
        body.price === undefined ||
        body.price === null ||
        body.price === '' ||
        body.stock === undefined ||
        body.stock === null ||
        body.stock === '' ||
        !categoryId
      ) {
        return reply
          .status(400)
          .send(
            formatError(
              400,
              'Field wajib belum lengkap: nama, harga, stok, kategori. Harap lengkapi isian.',
            ),
          );
      }

      if (!Number.isFinite(price) || price < 0) {
        return reply
          .status(400)
          .send(formatError(400, 'Harga harus berupa angka yang valid dan tidak negatif.'));
      }

      if (!Number.isInteger(stock) || stock < 0) {
        return reply
          .status(400)
          .send(formatError(400, 'Stok harus berupa bilangan bulat yang valid dan tidak negatif.'));
      }

      if (!(await this.productsService.categoryExists(categoryId))) {
        return reply.status(400).send(formatError(400, 'Kategori tidak ditemukan.'));
      }

      const product = await this.productsService.create({
        ...body,
        name,
        price,
        stock,
        category_id: categoryId,
        image_url: imageUrl || body.image_url || null,
      });
      return reply.status(201).success(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar. Silakan coba lagi.';
      return reply.status(400).send(formatError(400, message));
    }
  }

  /**
   * Update product by ID (admin only).
   * @param request - Fastify request with product ID and UpdateProductBody
   * @param reply - Fastify reply
   * @returns 200 with updated product or 404 if not found
   */
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const imageUrl = await processImageUpload(request);
      const body = extractBodyFields(request.body);

      if (typeof body.name === 'string' && body.name.trim() === '') {
        return reply.status(400).send(formatError(400, 'Nama tidak boleh kosong.'));
      }

      if (body.price !== undefined && body.price !== null && body.price !== '') {
        const price = Number(body.price);
        if (!Number.isFinite(price) || price < 0) {
          return reply
            .status(400)
            .send(formatError(400, 'Harga harus berupa angka yang valid dan tidak negatif.'));
        }
        body.price = price;
      }

      if (body.stock !== undefined && body.stock !== null && body.stock !== '') {
        const stock = Number(body.stock);
        if (!Number.isInteger(stock) || stock < 0) {
          return reply
            .status(400)
            .send(formatError(400, 'Stok harus berupa bilangan bulat yang valid dan tidak negatif.'));
        }
        body.stock = stock;
      }

      if (body.category_id && !(await this.productsService.categoryExists(body.category_id))) {
        return reply.status(400).send(formatError(400, 'Kategori tidak ditemukan.'));
      }

      const product = await this.productsService.update(request.params.id, {
        ...body,
        image_url: imageUrl || body.image_url,
      });
      if (!product) {
        return reply.status(404).send(formatError(404, 'Produk tidak ditemukan.'));
      }
      return reply.success(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar. Silakan coba lagi.';
      return reply.status(400).send(formatError(400, message));
    }
  }

  /**
   * Delete product by ID (admin only).
   * @param request - Fastify request with product ID param
   * @param reply - Fastify reply
   * @returns 200 with success status
   */
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const result = await this.productsService.delete(request.params.id);
    return reply.success(result);
  }
}
