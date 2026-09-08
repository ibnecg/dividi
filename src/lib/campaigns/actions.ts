'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const draftSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório').max(100, 'O título é muito longo'),
  description: z.string().trim().min(1, 'A descrição é obrigatória').max(2000, 'A descrição é muito longa'),
  attribution: z.string().trim().min(1, 'A atribuição é obrigatória').max(200, 'A atribuição é muito longa'),
  slug: z.string().trim()
    .min(1, 'O slug é obrigatório')
    .max(100, 'O slug é muito longo')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'O slug deve conter apenas letras minúsculas, números e hifens'),
  creation_token: z.string().uuid('Token de criação inválido')
})

export async function createCampaignDraft(prevState: any, formData: FormData) {
  await requireUser()
  
  const validated = draftSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    attribution: formData.get('attribution'),
    slug: formData.get('slug'),
    creation_token: formData.get('creation_token')
  })
  
  if (!validated.success) {
    return {
      error: 'Campos inválidos. Por favor, verifique o formulário e tente novamente.',
      fieldErrors: validated.error.flatten().fieldErrors
    }
  }
  
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('create_campaign_draft', {
    input_creation_token: validated.data.creation_token,
    input_title: validated.data.title,
    input_description: validated.data.description,
    input_attribution: validated.data.attribution,
    input_slug: validated.data.slug
  })
  
  if (error || !data) {
    console.error('Error creating campaign draft:', error)
    return {
      error: 'Failed to save changes. Please try again.'
    }
  }
  
  revalidatePath('/espaco/campanhas')
  redirect(`/espaco/campanhas/${data.id}`)
}
