import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import * as React from 'react'

export default function RecoverPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-display">Recuperar senha</CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Enviaremos um link de redefinição para o seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-lg">
            <div className="space-y-sm">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="Seu e-mail" required />
            </div>
            <Button type="submit" className="w-full">
              Enviar link de redefinição
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/entrar" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
