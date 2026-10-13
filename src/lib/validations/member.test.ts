import { describe, it, expect } from 'vitest';
import { inviteMemberSchema, acceptInviteSchema } from './member';

describe('inviteMemberSchema', () => {
  it('validates and normalizes valid email to lowercase', () => {
    const result = inviteMemberSchema.safeParse({
      email: '  Usuario@Exemplo.COM  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('usuario@exemplo.com');
      expect(result.data.role).toBe('member');
    }
  });

  it('fails when email is empty or invalid', () => {
    const emptyResult = inviteMemberSchema.safeParse({ email: '' });
    expect(emptyResult.success).toBe(false);

    const invalidEmailResult = inviteMemberSchema.safeParse({ email: 'not-an-email' });
    expect(invalidEmailResult.success).toBe(false);
  });
});

describe('acceptInviteSchema', () => {
  it('validates minimal token', () => {
    const result = acceptInviteSchema.safeParse({
      token: 'valid-token-123',
    });

    expect(result.success).toBe(true);
  });

  it('validates with registration fields', () => {
    const result = acceptInviteSchema.safeParse({
      token: 'valid-token-123',
      name: 'João Silva',
      password: 'strongpassword123',
    });

    expect(result.success).toBe(true);
  });

  it('fails if token is empty', () => {
    const result = acceptInviteSchema.safeParse({
      token: '',
    });

    expect(result.success).toBe(false);
  });

  it('fails if password is shorter than 8 chars when provided', () => {
    const result = acceptInviteSchema.safeParse({
      token: 'valid-token-123',
      name: 'João',
      password: '123',
    });

    expect(result.success).toBe(false);
  });
});
