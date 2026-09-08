'use client'

import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import * as React from 'react'
import { useActionState } from 'react'

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-display">Entrar</CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Acesse sua conta para continuar.
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
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="Seu e-mail" 
                  defaultValue={state?.formData?.email}
                  required 
                  aria-invalid={!!state?.errors?.email}
                />
                {state?.errors?.email && (
                  <p className="text-sm font-medium text-destructive">
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
                />
                {state?.errors?.password && (
                  <p className="text-sm font-medium text-destructive">
                    {state.errors.password[0]}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Link href="/recuperar-senha" className="text-sm font-medium text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending} aria-busy={pending}>
              {pending ? 'Acessando seu espaço...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link href="/cadastrar" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
