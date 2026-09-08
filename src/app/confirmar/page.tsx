import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import * as React from 'react'

export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-display">Confirme seu e-mail</CardTitle>
          <CardDescription className="text-body text-muted-foreground">
            Enviamos um link de confirmação para o seu e-mail. Abra o e-mail para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" variant="outline">
            <Link href="/entrar">Ir para entrar</Link>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" className="font-medium text-primary hover:underline">
            Reenviar e-mail
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
