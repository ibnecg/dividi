import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HeartHandshake,
  ListTodo,
  Gift,
  Search,
  HandHeart,
  PackageCheck,
  ArrowRight
} from "lucide-react"

import Link from "next/link"
import { PublicHeader } from "@/components/public-header"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center sm:pt-32 sm:pb-24">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl max-w-4xl">
          Dividi
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Conectamos quem precisa de ajuda com quem quer ajudar. Um sistema de doações focado em necessidades reais e impacto social transparente.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard/campaigns/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full font-medium text-base">
              Criar Campanha
            </Button>
          </Link>
          <Link href="/campaigns" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full font-medium text-base">
              Quero Doar
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Nosso Propósito</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O Dividi nasceu para transformar a maneira como as doações são feitas, garantindo que a ajuda chegue exatamente onde é necessária.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background border border-border">
              <div className="p-3 bg-primary/5 rounded-full">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Transparência</h3>
              <p className="text-muted-foreground">Saiba exatamente para onde vai a sua doação e quem você está ajudando.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background border border-border">
              <div className="p-3 bg-primary/5 rounded-full">
                <HeartHandshake className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Necessidade Real</h3>
              <p className="text-muted-foreground">Campanhas focadas em itens específicos que as pessoas e ONGs realmente precisam.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-background border border-border">
              <div className="p-3 bg-primary/5 rounded-full">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium">Menos Desperdício</h3>
              <p className="text-muted-foreground">Doando apenas o que foi solicitado, evitamos o excesso e o desperdício de recursos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Como Funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O Dividi é simples de usar, seja você alguém precisando de ajuda ou alguém querendo fazer a diferença.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
            {/* Para Organizadores */}
            <div className="space-y-8">
              <h3 className="text-2xl font-medium border-b border-border pb-4">Para quem precisa (Organizador)</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">1. Crie sua campanha</h4>
                    <p className="text-muted-foreground mt-1">Faça seu cadastro e conte a sua história. É rápido e gratuito.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">2. Liste os itens</h4>
                    <p className="text-muted-foreground mt-1">Adicione exatamente quais itens e as quantidades que você necessita.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">3. Receba doações</h4>
                    <p className="text-muted-foreground mt-1">Acompanhe as doações e receba os itens diretamente dos doadores.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Para Doadores */}
            <div className="space-y-8">
              <h3 className="text-2xl font-medium border-b border-border pb-4">Para quem quer doar (Doador)</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">1. Encontre uma campanha</h4>
                    <p className="text-muted-foreground mt-1">Explore as campanhas ativas e encontre uma causa que toque seu coração.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <HandHeart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">2. Escolha o item</h4>
                    <p className="text-muted-foreground mt-1">Selecione na lista da campanha o item específico que você deseja doar.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted/50">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">3. Faça a entrega</h4>
                    <p className="text-muted-foreground mt-1">Siga as instruções de entrega da campanha e faça a diferença na vida de alguém.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">Perguntas Frequentes</h2>
            <p className="text-lg text-muted-foreground">
              Tire suas dúvidas e sinta-se seguro para usar o Dividi.
            </p>
          </div>

          <Accordion className="w-full bg-background rounded-2xl border border-border px-6 py-2 shadow-sm">
            <AccordionItem value="item-1">
              <AccordionTrigger>O uso da plataforma é gratuito?</AccordionTrigger>
              <AccordionContent>
                Sim, o Dividi é 100% gratuito tanto para quem cria campanhas quanto para quem realiza doações. Nosso objetivo é facilitar a conexão e gerar impacto social.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Como faço a entrega do item doado?</AccordionTrigger>
              <AccordionContent>
                Cada campanha possui instruções específicas de entrega definidas pelo organizador. Ao escolher um item para doar, você receberá os detalhes de como e onde entregar.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Posso doar dinheiro em vez de itens?</AccordionTrigger>
              <AccordionContent>
                O foco do Dividi é a doação direta de itens específicos para evitar desvios e garantir que a necessidade real seja suprida. No momento, não intermediamos doações financeiras.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="border-b-0">
              <AccordionTrigger>Qualquer pessoa pode criar uma campanha?</AccordionTrigger>
              <AccordionContent>
                Sim! Indivíduos, famílias, abrigos e ONGs podem criar campanhas. É necessário apenas criar uma conta e listar os itens que precisam.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer (Simples) */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Dividi. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
