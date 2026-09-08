import { requireUser } from '@/lib/auth/require-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './setup-form'

export default async function SetupPage() {
  const user = await requireUser()
  const supabase = await createClient()
  
  // Check if they already have an organization
  const { data: orgs } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    
  if (orgs && orgs.length > 0) {
    redirect('/espaco')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-display">Crie sua organização</CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Para acessar seu espaço privado, informe o nome da sua organização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  )
}
