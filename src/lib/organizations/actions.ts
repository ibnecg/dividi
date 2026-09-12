'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { organizationSchema } from './validation'

export async function createOrganization(prevState: unknown, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const result = organizationSchema.safeParse(data)
  
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString() }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_organization', { input_name: result.data.name })

  if (error) {
    return { 
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString() }
    }
  }

  redirect('/espaco')
}
