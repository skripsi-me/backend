/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and trims whitespace.
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitize(input: string | null | undefined): string {
  if (!input) return '';
  // Strip HTML tags and trim whitespace
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize multiple fields from an object.
 * @param obj - Object with fields to sanitize
 * @param fields - Array of field names to sanitize
 * @returns New object with sanitized fields
 */
export function sanitizeFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      (result as any)[field] = sanitize(result[field]);
    }
  }
  return result;
}
