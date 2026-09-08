'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signUpSchema, signInSchema } from './validation'

export async function signUp(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const result = signUpSchema.safeParse(data)
  
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString(), email: data.email?.toString() }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        name: result.data.name
      }
    }
  })

  if (error) {
    return { 
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { name: data.name?.toString(), email: data.email?.toString() }
    }
  }

  redirect('/confirmar')
}

export async function signIn(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const result = signInSchema.safeParse(data)
  
  if (!result.success) {
    return {
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      errors: result.error.flatten().fieldErrors,
      formData: { email: data.email?.toString() }
    }
  }

  const supabase = await createClient()
  const { error, data: authData } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  })

  if (error || !authData.user) {
    return { 
      message: 'Não foi possível concluir esta ação. Revise os dados e tente novamente.',
      formData: { email: data.email?.toString() }
    }
  }

  const { data: orgs } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    
  if (orgs && orgs.length > 0) {
    redirect('/espaco')
  }

  redirect('/setup')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
