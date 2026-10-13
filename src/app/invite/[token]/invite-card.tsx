'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { acceptInvitationAction } from './actions';
import { authClient } from '@/lib/auth/client';
import { CheckCircle2, AlertCircle, LogIn, UserPlus, Building2 } from 'lucide-react';
import Link from 'next/link';

interface InviteCardProps {
  token: string;
  invite: {
    id: string;
    email: string;
    role: string;
    organizationName: string;
    expiresAt: Date | string;
  };
  currentUser: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export function InviteCard({ token, invite, currentUser }: InviteCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // 1. Aceite direto para usuário autenticado
  const handleAcceptLoggedIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await acceptInvitationAction(token);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Ocorreu um erro ao aceitar o convite. Tente novamente.');
      setLoading(false);
    }
  };

  // 2. Cadastro de nova conta e aceite automático
  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar conta no Neon Auth
      const { data, error: authError } = await authClient.signUp.email({
        email: invite.email,
        password,
        name,
      });

      if (authError) {
        setError(authError.message || 'Erro ao criar conta no sistema de autenticação.');
        setLoading(false);
        return;
      }

      if (!data?.user) {
        setError('Erro inesperado: Usuário não retornado após cadastro.');
        setLoading(false);
        return;
      }

      // 2. Aceitar o convite e vincular à organização existente
      const acceptResult = await acceptInvitationAction(token);
      if (acceptResult.error) {
        setError(acceptResult.error);
        setLoading(false);
        return;
      }

      // 3. Sucesso! Redirecionar para o dashboard
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Ocorreu um erro ao processar o cadastro.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Detalhes do Convite */}
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Convite de Membro
        </h1>
        <p className="text-sm text-muted-foreground">
          Você foi convidado para ingressar na equipe de:
        </p>
        <p className="text-lg font-semibold text-foreground">
          {invite.organizationName}
        </p>
      </div>

      {error && (
        <div className="flex items-start space-x-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cenário A: Usuário já está autenticado */}
      {currentUser ? (
        <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
          <div className="text-sm text-muted-foreground">
            Você está conectado como:
            <div className="font-medium text-foreground mt-0.5">
              {currentUser.name || currentUser.email} ({currentUser.email})
            </div>
          </div>

          <Button
            onClick={handleAcceptLoggedIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{loading ? 'Aceitando convite...' : 'Aceitar Convite e Entrar'}</span>
          </Button>
        </div>
      ) : (
        /* Cenário B: Usuário não está autenticado */
        <div className="space-y-4">
          <form onSubmit={handleRegisterAndAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-email">E-mail Convidado</Label>
              <Input
                id="reg-email"
                type="email"
                value={invite.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-name">Seu Nome Completo</Label>
              <Input
                id="reg-name"
                type="text"
                placeholder="Ex: Maria Pereira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">Crie uma Senha</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{loading ? 'Cadastrando e Aceitando...' : 'Criar Conta e Aceitar Convite'}</span>
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/login?callbackUrl=/invite/${token}`}
              className="inline-flex items-center text-sm font-medium text-foreground hover:underline"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              Já possui uma conta? Entrar para aceitar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
