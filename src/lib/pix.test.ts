import { describe, it, expect } from 'vitest';
import { generatePixPayload, sanitizeText, calculateCrc16 } from './pix';

describe('PIX EMV Utilities', () => {
  describe('calculateCrc16', () => {
    it('calculates the standard CCITT-FALSE CRC16 checksum for known test vectors', () => {
      // Standard CRC-16/CCITT-FALSE check value for '123456789' is 0x29B1
      expect(calculateCrc16('123456789')).toBe('29B1');
    });
  });

  describe('sanitizeText', () => {
    it('removes accents, non-alphanumeric characters, and converts to uppercase', () => {
      expect(sanitizeText('Ação Solidária de Inverno! #1', 25)).toBe('ACAO SOLIDARIA DE INVERNO');
      expect(sanitizeText('São Paulo - SP', 15)).toBe('SAO PAULO  SP');
    });

    it('respects maxLength constraint', () => {
      const longText = 'Esta é uma descrição extremamente longa para um recebedor';
      const sanitized = sanitizeText(longText, 25);
      expect(sanitized.length).toBeLessThanOrEqual(25);
    });
  });

  describe('generatePixPayload', () => {
    it('generates a valid BR Code payload with amount and pixKey', () => {
      const payload = generatePixPayload({
        pixKey: '12345678900',
        amount: 50.0,
        merchantName: 'Campanha de Agasalho',
        merchantCity: 'Curitiba',
      });

      // Starts with format indicator and point of initiation
      expect(payload).toContain('000201');
      expect(payload).toContain('010212');

      // Merchant Account Information (26) with GUI and key
      expect(payload).toContain('0014br.gov.bcb.pix');
      expect(payload).toContain('011112345678900');

      // Currency 986 (BRL)
      expect(payload).toContain('5303986');

      // Amount 50.00
      expect(payload).toContain('540550.00');

      // Country BR
      expect(payload).toContain('5802BR');

      // Merchant Name and City
      expect(payload).toContain('CAMPANHA DE AGASALHO');
      expect(payload).toContain('CURITIBA');

      // CRC Tag 6304 followed by 4 hex characters
      expect(payload).toMatch(/6304[A-F0-9]{4}$/);

      // Verify CRC validity
      const rawWithoutCrc = payload.slice(0, -4);
      const expectedCrc = calculateCrc16(rawWithoutCrc);
      expect(payload.slice(-4)).toBe(expectedCrc);
    });

    it('formats amount with two decimal places correctly', () => {
      const payload = generatePixPayload({
        pixKey: 'teste@exemplo.com',
        amount: 12.5,
      });

      expect(payload).toContain('540512.50');
    });

    it('throws when pixKey is missing or blank', () => {
      expect(() => generatePixPayload({ pixKey: '', amount: 10 })).toThrow('Chave PIX é obrigatória');
      expect(() => generatePixPayload({ pixKey: '   ', amount: 10 })).toThrow('Chave PIX é obrigatória');
    });

    it('throws when amount is zero or negative', () => {
      expect(() => generatePixPayload({ pixKey: 'key', amount: 0 })).toThrow('Valor da doação deve ser maior que zero');
      expect(() => generatePixPayload({ pixKey: 'key', amount: -5 })).toThrow('Valor da doação deve ser maior que zero');
    });
  });
});
