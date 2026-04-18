import { prisma } from '../lib/prisma.js';
import { slugify } from './slugify.js';

/**
 * Generates a unique slug for a given model field.
 * Appends a numeric suffix (-2, -3, …) until no conflicting record exists.
 *
 * @param {string} text - The text to slugify.
 * @param {string} model - The Prisma model name (e.g. 'club', 'event').
 * @param {string} field - The field to check for uniqueness (e.g. 'slug').
 * @param {string|null} excludeId - Optional record ID to exclude (for updates).
 * @returns {Promise<string>} A unique slug string.
 */
export async function slugifyUnique(text, model, field, excludeId = null) {
  const base = slugify(text);
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = await prisma[model].findFirst({
      where: { [field]: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!existing) return candidate;
    candidate = `${base}-${counter++}`;
  }
}
