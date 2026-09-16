import { CampaignForm } from '@/components/campaign-form';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function NewCampaignPage() {
  const { data: session } = await auth.getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Criar Nova Campanha</h1>
        <p className="text-muted-foreground mt-2">
          Preencha os detalhes abaixo para iniciar sua campanha de arrecadação.
        </p>
      </div>
      <CampaignForm />
    </div>
  );
}
