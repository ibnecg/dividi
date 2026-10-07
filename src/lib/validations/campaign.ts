import { z } from 'zod';

export const campaignItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'A descrição é obrigatória'),
  amount: z.coerce.number().nullish(),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser maior que zero').default(1),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
});

export const campaignSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  allowPix: z.boolean().default(true),
  allowInPerson: z.boolean().default(false),
  pixKey: z.string().optional().or(z.literal('')),
  inPersonAddress: z.string().optional().or(z.literal('')),
  inPersonDays: z.string().optional().or(z.literal('')),
  inPersonHours: z.string().optional().or(z.literal('')),
  inPersonInstructions: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  requiresDonationApproval: z.boolean().default(false),
  items: z.array(campaignItemSchema).default([]),
}).superRefine((data, ctx) => {
  if (!data.allowPix && !data.allowInPerson) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['allowPix'],
      message: 'Selecione pelo menos uma forma de doação (Pix ou Entrega presencial)',
    });
  }

  if (data.allowPix) {
    if (!data.pixKey || data.pixKey.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pixKey'],
        message: 'A chave PIX é obrigatória quando a doação via Pix está habilitada',
      });
    }
  }

  if (data.allowInPerson) {
    if (!data.inPersonAddress || data.inPersonAddress.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inPersonAddress'],
        message: 'O endereço é obrigatório e deve ter no mínimo 10 caracteres',
      });
    }
    if (!data.inPersonDays || data.inPersonDays.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inPersonDays'],
        message: 'Os dias disponíveis são obrigatórios (mín. 3 caracteres)',
      });
    }
    if (!data.inPersonHours || data.inPersonHours.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['inPersonHours'],
        message: 'Os horários disponíveis são obrigatórios (mín. 3 caracteres)',
      });
    }
  }
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const pledgeSchema = z.object({
  campaignItemId: z.string().min(1, 'Item inválido'),
  donationType: z.enum(['pix', 'in_person']).default('pix'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser maior que zero'),
  amount: z.coerce.number().min(1, 'Informe um valor válido a partir de R$ 1,00').optional(),
  donorName: z.string().optional(),
  donorPhone: z.string().optional(),
  message: z.string().optional(),
});

export type PledgeFormValues = z.infer<typeof pledgeSchema>;

export const donationIdSchema = z.string().min(1, 'Doação inválida');
