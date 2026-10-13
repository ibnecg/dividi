'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { revokeInvitationAction } from '@/app/dashboard/members/actions';
import { Mail, Copy, Check, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  inviterName?: string | null;
}

interface PendingInvitationsListProps {
  invitations: PendingInvitation[];
  isOwner: boolean;
}

export function PendingInvitationsList({ invitations, isOwner }: PendingInvitationsListProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopyLink = async (token: string) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const inviteUrl = `${origin}/invite/${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este convite? A vaga será liberada.')) {
      return;
    }

    setRevokingId(id);
    setError(null);

    try {
      const res = await revokeInvitationAction(id);
      if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Erro ao revogar convite.');
    } finally {
      setRevokingId(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-foreground" />
            <CardTitle className="text-xl">Convites Pendentes</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono">
            {invitations.length} pendente{invitations.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>
          Estes convites reservam vagas no limite da organização até que sejam aceitos ou cancelados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {invitations.map((invite) => {
            const expiresDate = new Date(invite.expiresAt);
            const formattedExp = format(expiresDate, "dd 'de' MMM, yyyy", { locale: ptBR });
            const isCopied = copiedToken === invite.token;

            return (
              <div
                key={invite.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-accent/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground text-sm">{invite.email}</span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                      Pendente
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Expira em {formattedExp}</span>
                    {invite.inviterName && <span>• Enviado por {invite.inviterName}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(invite.token)}
                    className="h-8 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-foreground" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copiar Link
                      </>
                    )}
                  </Button>

                  {isOwner && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokingId === invite.id}
                      onClick={() => handleRevoke(invite.id)}
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      {revokingId === invite.id ? 'Cancelando...' : 'Cancelar'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
