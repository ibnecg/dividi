import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { getOrganizationMembersData } from './actions';
import { InviteMemberForm } from '@/components/dashboard/invite-member-form';
import { MembersList } from '@/components/dashboard/members-list';
import { PendingInvitationsList } from '@/components/dashboard/pending-invitations-list';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Clock, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const data = await getOrganizationMembersData();

  if ('error' in data || !data.organization) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
        <div className="p-6 rounded-lg border border-border bg-card text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Acesso Indisponível</h2>
          <p className="text-sm text-muted-foreground">
            {data.error || 'Não foi possível carregar as informações dos membros.'}
          </p>
        </div>
      </div>
    );
  }

  const { organization, isOwner, members, invitations, counts, canInvite } = data;
  const currentUserId = session.user.id;

  // Criar representação visual das 3 vagas
  const slots = Array.from({ length: counts.limit }, (_, index) => {
    if (index < members.length) {
      const member = members[index];
      return {
        type: 'member' as const,
        title: member.name,
        subtitle: member.role === 'owner' ? 'Proprietário' : 'Membro ativo',
        status: 'occupied',
      };
    }

    const inviteIndex = index - members.length;
    if (inviteIndex < invitations.length) {
      const invite = invitations[inviteIndex];
      return {
        type: 'invite' as const,
        title: invite.email,
        subtitle: 'Convite pendente',
        status: 'reserved',
      };
    }

    return {
      type: 'empty' as const,
      title: 'Vaga Disponível',
      subtitle: 'Disponível para convite',
      status: 'available',
    };
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-foreground" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Membros da Organização
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Gerencie a equipe e os convites de acesso para <strong className="text-foreground">{organization.name}</strong>. Cada organização possui um limite estrito de 3 membros.
        </p>
      </div>

      {/* Card de Capacidade da Equipe (3 vagas) */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Capacidade da Equipe</CardTitle>
              <p className="text-xs text-muted-foreground">
                Membros ativos e convites pendentes ocupam vagas simultaneamente.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={counts.total >= counts.limit ? 'destructive' : 'default'}>
                {counts.total} de {counts.limit} vagas preenchidas
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Progresso Visual */}
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(counts.total / counts.limit) * 100}%` }}
            />
          </div>

          {/* Cards dos 3 Slots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border text-sm transition-all ${
                  slot.status === 'occupied'
                    ? 'border-border bg-card'
                    : slot.status === 'reserved'
                    ? 'border-border bg-muted/30'
                    : 'border-dashed border-border/80 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Vaga {idx + 1}
                  </span>
                  {slot.status === 'occupied' && (
                    <span className="flex items-center text-xs text-foreground font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Ativo
                    </span>
                  )}
                  {slot.status === 'reserved' && (
                    <span className="flex items-center text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Pendente
                    </span>
                  )}
                  {slot.status === 'available' && (
                    <span className="flex items-center text-xs text-muted-foreground">
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Livre
                    </span>
                  )}
                </div>
                <p className="font-semibold text-foreground truncate text-sm" title={slot.title}>
                  {slot.title}
                </p>
                <p className="text-xs text-muted-foreground">{slot.subtitle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Convidar Novo Membro (Apenas para Gestor/Owner) */}
      {isOwner && (
        <InviteMemberForm
          canInvite={canInvite}
          limit={counts.limit}
        />
      )}

      {/* Lista de Membros Ativos */}
      <MembersList
        members={members}
        isOwner={isOwner}
        currentUserId={currentUserId}
      />

      {/* Lista de Convites Pendentes */}
      <PendingInvitationsList
        invitations={invitations}
        isOwner={isOwner}
      />
    </div>
  );
}
