import { db } from "@/db"
import { campaigns } from "@/db/schema"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { desc } from "drizzle-orm"

export default async function CampaignsPage() {
  const activeCampaigns = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt))

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Campanhas Solidárias</h1>
      
      {activeCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl border border-border">
          <p className="text-xl text-muted-foreground mb-6">Não há campanhas ativas no momento.</p>
          <Link href="/">
            <Button>Voltar para o Início</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCampaigns.map((campaign) => (
            <Card key={campaign.id} className="flex flex-col overflow-hidden">
              {campaign.imageUrl && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={campaign.imageUrl} alt={campaign.name} className="object-cover w-full h-full" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{campaign.name}</CardTitle>
                <CardDescription className="line-clamp-3 mt-2">{campaign.description}</CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardFooter>
                <Link href={`/campaigns/${campaign.id}`} className="w-full">
                  <Button className="w-full">Ver Detalhes</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
