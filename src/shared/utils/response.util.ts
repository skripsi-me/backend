import { type FastifyReply } from 'fastify';
import { Type, type TSchema } from '@sinclair/typebox';

export interface ResponseMetadata {
  code: number;
  message: string;
}

export interface StandardResponse<T = any> {
  metadata: ResponseMetadata;
  data?: T;
  error?: Record<string, string>;
}

/**
 * TypeBox schema for standard response metadata
 */
export const MetadataSchema = Type.Object({
  code: Type.Number(),
  message: Type.String(),
});

/**
 * Creates a TypeBox schema for the standardized response
 */
export const createStandardResponseSchema = (dataSchema: TSchema) => {
  return Type.Object({
    metadata: MetadataSchema,
    data: dataSchema,
    error: Type.Optional(Type.Record(Type.String(), Type.String())),
  });
};

/**
 * Formats a successful response
 */
export function formatSuccess<T>(reply: FastifyReply, data: T, message = 'Success'): StandardResponse<T> {
  return {
    metadata: {
      code: reply.statusCode,
      message,
    },
    data,
  };
}

/**
 * Formats an error response
 */
export function formatError(
  code: number,
  message: string,
  validationErrors?: Record<string, string>
): StandardResponse {
  const response: StandardResponse = {
    metadata: {
      code,
      message,
    },
  };

  if (validationErrors) {
    response.error = validationErrors;
  }

  return response;
}
