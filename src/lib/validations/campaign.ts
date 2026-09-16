import { z } from 'zod';

export const campaignItemSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória'),
  amount: z.coerce.number().nullish(),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
});

export const campaignSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  pixKey: z.string().min(5, 'A chave PIX é obrigatória'),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  items: z.array(campaignItemSchema).default([]),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;
