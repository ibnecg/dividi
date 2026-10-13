'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { inviteMemberAction } from '@/app/dashboard/members/actions';
import { UserPlus, Copy, Check, AlertCircle, Info } from 'lucide-react';

interface InviteMemberFormProps {
  canInvite: boolean;
  limit: number;
}

export function InviteMemberForm({ canInvite, limit }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !canInvite) return;

    setLoading(true);
    setError(null);
    setCreatedInviteUrl(null);
    setCopied(false);

    try {
      const res = await inviteMemberAction({ email });
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.inviteUrl) {
        setCreatedInviteUrl(res.inviteUrl);
        setEmail('');
      }
    } catch {
      setError('Ocorreu um erro ao enviar o convite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdInviteUrl) return;
    try {
      await navigator.clipboard.writeText(createdInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-foreground" />
          <CardTitle className="text-xl">Convidar Novo Membro</CardTitle>
        </div>
        <CardDescription>
          Gere um link seguro de acesso para convidar um novo membro para sua organização.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canInvite && (
          <div className="flex items-start space-x-3 p-3 text-sm rounded-md bg-muted text-muted-foreground border border-border">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
            <div>
              <p className="font-medium text-foreground">Limite de vagas atingido</p>
              <p>
                Sua organização atingiu o limite de {limit} membros (incluindo membros ativos e convites pendentes). Para adicionar um novo membro, cancele um convite pendente ou remova um membro atual.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start space-x-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdInviteUrl && (
          <div className="p-4 rounded-md bg-accent/50 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Convite criado com sucesso!
              </span>
              <span className="text-xs text-muted-foreground">Válido por 7 dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie o link abaixo para o convidado ingressar diretamente na sua organização:
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <Input
                readOnly
                value={createdInviteUrl}
                className="text-xs font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5 text-foreground" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail do Convidado</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="colaborador@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canInvite || loading}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!canInvite || loading || !email.trim()}
                className="shrink-0"
              >
                {loading ? 'Gerando convite...' : 'Gerar Convite'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
