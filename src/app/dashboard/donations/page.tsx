import { db } from '@/db';
import { donations, campaignItems, campaigns } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { DonationReviewActions } from '@/components/dashboard/donation-review-actions';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { expireOverdueDonations } from '@/lib/donations/service';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default async function DonationsPage() {
  const { data: session } = await auth.getSession();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Sweep expired donations first
  await expireOverdueDonations();

  const userDonations = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      donorPhone: donations.donorPhone,
      status: donations.status,
      donatedAt: donations.donatedAt,
      createdAt: donations.createdAt,
      expiresAt: donations.expiresAt,
      amount: donations.amount,
      reversalReason: donations.reversalReason,
      donationType: donations.donationType,
      campaignName: campaigns.name,
      campaignId: campaigns.id,
      itemDescription: campaignItems.description,
    })
    .from(donations)
    .innerJoin(campaignItems, eq(donations.campaignItemId, campaignItems.id))
    .innerJoin(campaigns, eq(campaignItems.campaignId, campaigns.id))
    .where(eq(campaigns.userId, session.user.id))
    .orderBy(desc(donations.createdAt));

  const pendingDonations = userDonations.filter(d => d.status === 'pending');
  const pastDonations = userDonations.filter(d => d.status !== 'pending');

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Doações Recebidas</h1>
        <p className="text-muted-foreground text-sm">Aprove ou reprove as doações pendentes de suas campanhas.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Pendentes de Aprovação
          {pendingDonations.length > 0 && (
            <Badge variant="secondary" className="font-normal">{pendingDonations.length}</Badge>
          )}
        </h2>
        {pendingDonations.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Nenhuma doação aguardando aprovação no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingDonations.map(donation => (
              <Card key={donation.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/campaigns/${donation.campaignId}`} className="text-sm font-medium hover:underline flex items-center gap-1 text-primary">
                            {donation.campaignName}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <span className="text-muted-foreground text-sm">•</span>
                          <span className="text-sm font-medium">{donation.itemDescription}</span>
                        </div>
                        <h3 className="text-lg font-semibold">{donation.donorName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {donation.donationType === 'pix' ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">PIX</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-900">Presencial</Badge>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {donation.donorPhone}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-sm bg-yellow-500/10 text-yellow-800 dark:text-yellow-500 px-3 py-2 rounded-md w-fit">
                        Expira em {formatDistanceToNow(new Date(donation.expiresAt!), { locale: ptBR })}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Registrado há {formatDistanceToNow(new Date((donation.donatedAt ?? donation.createdAt)!), { locale: ptBR })}
                      </div>
                      <DonationReviewActions donationId={donation.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold">Histórico de Doações</h2>
        {pastDonations.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">O histórico de doações está vazio.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Doador</th>
                    <th className="px-4 py-3 font-medium">Campanha / Item</th>
                    <th className="px-4 py-3 font-medium">Método</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {pastDonations.map(donation => (
                    <tr key={donation.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium">{donation.donorName}</div>
                        <div className="text-muted-foreground text-xs">{donation.donorPhone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium truncate max-w-[200px]" title={donation.campaignName}>{donation.campaignName}</div>
                        <div className="text-muted-foreground text-xs truncate max-w-[200px]">{donation.itemDescription}</div>
                      </td>
                      <td className="px-4 py-4">
                        {donation.donationType === 'pix' ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">PIX</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-900 font-medium">Presencial</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <div className="font-medium text-foreground">
                          {format(new Date((donation.donatedAt ?? donation.createdAt)!), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs">
                          {format(new Date((donation.donatedAt ?? donation.createdAt)!), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {donation.status === 'approved' ? (
                          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200 dark:border-green-900 dark:text-green-400">
                            Aprovada
                          </Badge>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge variant="destructive" className="w-fit">
                              Estornada
                            </Badge>
                            {donation.reversalReason && (
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={donation.reversalReason}>
                                {donation.reversalReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
