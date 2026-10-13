import { getInvitationDetails } from './actions';
import { auth } from '@/lib/auth/server';
import { InviteCard } from './invite-card';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const [details, sessionResult] = await Promise.all([
    getInvitationDetails(token),
    auth.getSession(),
  ]);

  const currentUser = sessionResult?.data?.user
    ? {
        id: sessionResult.data.user.id,
        name: sessionResult.data.user.name,
        email: sessionResult.data.user.email,
      }
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <ThemeToggle variant="dropdown" />
      </div>

      <div className="w-full max-w-md bg-background rounded-xl border border-border shadow-sm p-8">
        {!details.valid || !details.invite ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Convite Indisponível</h1>
              <p className="text-sm text-muted-foreground">
                {details.error || 'Não foi possível validar este convite.'}
              </p>
            </div>
            <Link href="/" className="inline-block pt-2">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Início
              </Button>
            </Link>
          </div>
        ) : (
          <InviteCard
            token={token}
            invite={details.invite}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}
