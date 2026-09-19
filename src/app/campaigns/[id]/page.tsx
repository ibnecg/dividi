import { db } from "@/db"
import { campaigns, campaignItems } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PledgeDialog } from "@/components/pledge-dialog"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch campaign details
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1)

  if (!campaign) {
    notFound()
  }

  // Fetch associated items
  const items = await db
    .select()
    .from(campaignItems)
    .where(eq(campaignItems.campaignId, id))

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      {campaign.imageUrl && (
        <div className="w-full aspect-[21/9] bg-muted mb-8 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={campaign.imageUrl} alt={campaign.name} className="object-cover w-full h-full" />
        </div>
      )}
      
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{campaign.name}</h1>
        <p className="text-lg text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
        
        {campaign.pixKey && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border inline-block">
            <p className="text-sm font-medium mb-1">Chave PIX para doação direta:</p>
            <p className="text-lg font-mono">{campaign.pixKey}</p>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-6">Itens Necessários</h2>
      
      {items.length === 0 ? (
        <p className="text-muted-foreground">Esta campanha não possui itens específicos listados no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden">
              {item.imageUrl && (
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.description} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{item.description}</CardTitle>
                {item.amount && (
                  <CardDescription className="text-lg font-medium text-foreground mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.amount))}
                  </CardDescription>
                )}
                <div className="mt-2 text-sm text-muted-foreground">
                  Faltam: <span className="font-medium text-foreground">{item.quantity}</span>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pb-6">
                {item.quantity && item.quantity > 0 ? (
                  <PledgeDialog
                    item={item}
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    campaignPixKey={campaign.pixKey}
                  />
                ) : (
                  <div className="w-full text-center py-2 mt-4 bg-muted text-muted-foreground rounded-md font-medium text-sm">
                    Esgotado
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
