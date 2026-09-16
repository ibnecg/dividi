import { describe, it, expect } from 'vitest';
import { campaignSchema, campaignItemSchema } from './campaign';

describe('Campaign Validations', () => {
  describe('campaignItemSchema', () => {
    it('should validate a correct campaign item', () => {
      const result = campaignItemSchema.safeParse({
        description: 'Winter Jacket',
        amount: 50.00,
        imageUrl: 'https://example.com/jacket.png'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if description is missing', () => {
      const result = campaignItemSchema.safeParse({
        amount: 50.00,
      });
      expect(result.success).toBe(false);
    });

    it('should allow nullish amount', () => {
      const result = campaignItemSchema.safeParse({
        description: 'Blanket',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('campaignSchema', () => {
    it('should validate a correct campaign', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        pixKey: 'pix-key@example.com',
        items: []
      });
      expect(result.success).toBe(true);
    });

    it('should fail if name is too short', () => {
      const result = campaignSchema.safeParse({
        name: 'Wi',
        description: 'Collecting warm clothes for winter.',
        pixKey: 'pix-key@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O nome deve ter no mínimo 3 caracteres');
      }
    });
  });
});
