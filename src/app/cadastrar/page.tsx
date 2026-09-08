'use client'

import { signUp } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import * as React from 'react'
import { useActionState } from 'react'

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-display">Crie sua conta</CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Você vai confirmar seu e-mail antes de acessar o espaço da organização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.message && (
            <div className="mb-sm text-sm font-medium text-destructive">
              {state.message}
            </div>
          )}
          <form action={formAction} className="space-y-lg">
            <div className="space-y-md">
              <div className="space-y-sm">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Seu nome" 
                  defaultValue={state?.formData?.name} 
                  required 
                  aria-invalid={!!state?.errors?.name}
                  aria-describedby={state?.errors?.name ? 'name-error' : undefined}
                />
                {state?.errors?.name && (
                  <p id="name-error" className="text-sm font-medium text-destructive">
                    {state.errors.name[0]}
                  </p>
                )}
              </div>
              <div className="space-y-sm">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="Seu e-mail" 
                  defaultValue={state?.formData?.email} 
                  required 
                  aria-invalid={!!state?.errors?.email}
                  aria-describedby={state?.errors?.email ? 'email-error' : undefined}
                />
                {state?.errors?.email && (
                  <p id="email-error" className="text-sm font-medium text-destructive">
                    {state.errors.email[0]}
                  </p>
                )}
              </div>
              <div className="space-y-sm">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  aria-invalid={!!state?.errors?.password}
                  aria-describedby={state?.errors?.password ? 'password-error' : undefined}
                />
                {state?.errors?.password && (
                  <p id="password-error" className="text-sm font-medium text-destructive">
                    {state.errors.password[0]}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
              {pending ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/entrar" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
