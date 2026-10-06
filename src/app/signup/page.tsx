import SignUpForm from './signup-form';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <ThemeToggle variant="dropdown" />
      </div>
      <div className="w-full max-w-md bg-background rounded-xl border border-border shadow-sm p-8">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Criar Conta</h1>
          <p className="text-muted-foreground">Cadastre-se e crie sua organização na plataforma Dividi.</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
