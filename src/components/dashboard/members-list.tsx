'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { removeMemberAction } from '@/app/dashboard/members/actions';
import { Users, UserMinus, ShieldCheck, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface OrgMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
}

interface MembersListProps {
  members: OrgMember[];
  isOwner: boolean;
  currentUserId: string;
}

export function MembersList({ members, isOwner, currentUserId }: MembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async (userId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName} da organização?`)) {
      return;
    }

    setRemovingId(userId);
    setError(null);

    try {
      const res = await removeMemberAction(userId);
      if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Erro ao remover membro da organização.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-foreground" />
            <CardTitle className="text-xl">Membros Ativos</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono">
            {members.length} membro{members.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>
          Pessoas que atualmente possuem acesso de gestão e operação na organização.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const isMemberOwner = member.role === 'owner';
            const joinedDate = new Date(member.createdAt);
            const formattedDate = format(joinedDate, "dd 'de' MMM, yyyy", { locale: ptBR });
            const initial = (member.name || member.email || 'U').charAt(0).toUpperCase();

            return (
              <div
                key={member.userId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {initial}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground text-sm">{member.name}</span>
                      {isSelf && (
                        <span className="text-xs text-muted-foreground font-normal">(Você)</span>
                      )}
                      {isMemberOwner ? (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Proprietário
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          Membro
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.email} • Membro desde {formattedDate}
                    </p>
                  </div>
                </div>

                {isOwner && !isSelf && !isMemberOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={removingId === member.userId}
                    onClick={() => handleRemove(member.userId, member.name)}
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 self-start sm:self-auto"
                  >
                    <UserMinus className="h-3.5 w-3.5 mr-1" />
                    {removingId === member.userId ? 'Removendo...' : 'Remover'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
