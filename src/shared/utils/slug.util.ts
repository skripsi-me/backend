/**
 * Generate a unique slug from a name.
 * Converts name to lowercase, replaces spaces with hyphens, removes special characters.
 * If slug already exists, appends a number suffix.
 * @param name - The name to generate slug from
 * @param findExisting - Returns existing slugs matching the prefix
 * @param maxLength - Optional max slug length (truncates)
 * @returns Unique slug string
 */
export async function generateUniqueSlug(
  name: string,
  findExisting: (prefix: string) => Promise<string[]>,
  maxLength?: number,
): Promise<string> {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (maxLength) slug = slug.slice(0, maxLength);
  slug = slug.replace(/-+$/, '');

  const existing = await findExisting(slug);
  if (existing.length === 0) return slug;

  let counter = 1;
  while (existing.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}