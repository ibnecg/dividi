import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit3 } from 'lucide-react';
import { CampaignStatusToggle } from '@/components/campaign-status-toggle';

export default async function CampaignsPage() {
  const { data: session } = await auth.getSession();
  
  if (!session?.user?.id) {
    return null;
  }

  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, session.user.id))
    .orderBy(desc(campaigns.createdAt));

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Campanhas</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas campanhas de doação.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </Link>
      </div>

      {userCampaigns.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-2 text-foreground">Nenhuma campanha encontrada</h2>
          <p className="text-muted-foreground mb-6">Você ainda não criou nenhuma campanha de arrecadação.</p>
          <Link href="/dashboard/campaigns/new">
            <Button>Criar a primeira campanha</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCampaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col h-full overflow-hidden">
              {campaign.imageUrl && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg shrink-0 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={campaign.imageUrl} alt={campaign.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{campaign.name}</CardTitle>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 border ${
                      campaign.isActive
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {campaign.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="text-xs text-muted-foreground">
                  Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                </Link>
                <CampaignStatusToggle
                  campaignId={campaign.id}
                  isActive={campaign.isActive}
                  campaignName={campaign.name}
                  size="sm"
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
