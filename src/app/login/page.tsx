import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
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
