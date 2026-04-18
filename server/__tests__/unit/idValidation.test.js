import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { objectIdSchema } from '../../middleware/validate.js';

// Feature: clubsetu-backend-refactor
// Property 18: ID Format Validation
// Validates: Requirements 7.1, 7.2, 7.4

describe('objectIdSchema — Property 18: ID Format Validation', () => {
  it('accepts any 24-character lowercase hex string', () => {
    // Generator: exactly 24 chars from [a-f0-9]
    const hexChar = fc.constantFrom(...'abcdef0123456789'.split(''));
    const validId = fc.array(hexChar, { minLength: 24, maxLength: 24 }).map(chars => chars.join(''));

    fc.assert(
      fc.property(validId, (id) => {
        const result = objectIdSchema.safeParse(id);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects any string that does not match /^[a-f0-9]{24}$/', () => {
    // Generator: strings that are NOT valid 24-char hex IDs
    const invalidId = fc.string().filter(s => !/^[a-f0-9]{24}$/.test(s));

    fc.assert(
      fc.property(invalidId, (id) => {
        const result = objectIdSchema.safeParse(id);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('includes "Invalid ID format" message for a known invalid input', () => {
    const result = objectIdSchema.safeParse('not-a-valid-id');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages).toContain('Invalid ID format');
    }
  });
});
