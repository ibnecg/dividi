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
    it('should validate a correct campaign with Pix', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        allowPix: true,
        allowInPerson: false,
        pixKey: 'pix-key@example.com',
        items: []
      });
      expect(result.success).toBe(true);
    });

    it('should validate a correct campaign with In-Person', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        allowPix: false,
        allowInPerson: true,
        inPersonAddress: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        inPersonDays: 'Segunda a Sexta',
        inPersonHours: '08:00 às 18:00',
        items: []
      });
      expect(result.success).toBe(true);
    });

    it('should fail if name is too short', () => {
      const result = campaignSchema.safeParse({
        name: 'Wi',
        description: 'Collecting warm clothes for winter.',
        allowPix: true,
        pixKey: 'pix-key@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O nome deve ter no mínimo 3 caracteres');
      }
    });

    it('should fail if neither Pix nor In-Person is allowed', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        allowPix: false,
        allowInPerson: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'Selecione pelo menos uma forma de doação (Pix ou Entrega presencial)')).toBe(true);
      }
    });

    it('should fail if Pix is allowed but key is missing', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        allowPix: true,
        pixKey: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'A chave PIX é obrigatória quando a doação via Pix está habilitada')).toBe(true);
      }
    });

    it('should fail if In-Person is allowed but details are missing', () => {
      const result = campaignSchema.safeParse({
        name: 'Winter Drive',
        description: 'Collecting warm clothes for winter.',
        allowPix: false,
        allowInPerson: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'O endereço é obrigatório e deve ter no mínimo 10 caracteres')).toBe(true);
      }
    });
  });
});
