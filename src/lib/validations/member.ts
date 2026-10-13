import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z
    .string({
      error: 'O e-mail é obrigatório',
    })
    .trim()
    .toLowerCase()
    .min(1, 'O e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  role: z.enum(['member'], {
    error: 'Papel inválido',
  }).default('member'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token de convite é obrigatório'),
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').optional(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').optional(),
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
