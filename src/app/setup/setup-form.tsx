'use client'

import { createOrganization } from '@/lib/organizations/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as React from 'react'
import { useActionState } from 'react'

export function SetupForm() {
  const [state, formAction, pending] = useActionState(createOrganization, null)

  return (
    <form action={formAction} className="space-y-lg">
      {state?.message && (
        <div className="mb-sm text-sm font-medium text-destructive">
          {state.message}
        </div>
      )}
      <div className="space-y-sm">
        <Label htmlFor="name">Nome da organização</Label>
        <Input 
          id="name" 
          name="name" 
          placeholder="Nome da organização" 
          defaultValue={state?.formData?.name}
          maxLength={120} 
          required 
          aria-invalid={!!state?.errors?.name}
        />
        {state?.errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {state.errors.name[0]}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
        {pending ? 'Criando organização...' : 'Criar organização'}
      </Button>
    </form>
  )
}
