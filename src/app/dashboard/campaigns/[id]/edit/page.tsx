import { CampaignForm } from '@/components/campaign-form';
import { CampaignStatusToggle } from '@/components/campaign-status-toggle';
import { db } from '@/db';
import { campaigns, campaignItems } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const { id } = await params;
  const { data: session } = await auth.getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign || campaign.userId !== session.user.id) {
    redirect('/dashboard/campaigns');
  }

  const items = await db
    .select()
    .from(campaignItems)
    .where(eq(campaignItems.campaignId, id));

  const initialData = {
    name: campaign.name,
    description: campaign.description,
    pixKey: campaign.pixKey,
    imageUrl: campaign.imageUrl || '',
    requiresDonationApproval: campaign.requiresApproval,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      amount: item.amount ? Number(item.amount) : undefined,
      quantity: item.quantity,
      imageUrl: item.imageUrl || '',
    })),
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto mb-8 space-y-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar para Campanhas
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Editar Campanha</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  campaign.isActive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {campaign.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Atualize as informações e itens necessários da sua campanha.
            </p>
          </div>
          <div>
            <CampaignStatusToggle
              campaignId={campaign.id}
              isActive={campaign.isActive}
              campaignName={campaign.name}
            />
          </div>
        </div>
      </div>
      <CampaignForm campaignId={campaign.id} initialData={initialData} />
    </div>
  );
}
