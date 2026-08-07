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
