import LoginForm from './login-form';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link href="/" className={cn(buttonVariants({ variant: 'ghost' }), "text-muted-foreground")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </div>
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <ThemeToggle variant="dropdown" />
      </div>
      <div className="w-full max-w-md bg-background rounded-xl border border-border shadow-sm p-8">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Entrar</h1>
          <p className="text-muted-foreground">Acesse sua conta na plataforma Dividi.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
