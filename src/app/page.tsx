import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-background min-h-screen py-12 px-4 sm:px-6">
      <main className="w-full max-w-3xl flex-col space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Dividi Design System</h1>
          <p className="text-muted-foreground text-lg">
            A minimalist, high-contrast black and white design system for open-source donation management.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="icon"><Heart className="h-4 w-4" /></Button>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Form Elements</h2>
          <div className="grid gap-6 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="hello@dividi.org" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="error-input">Donation Amount</Label>
              <Input id="error-input" type="number" placeholder="50" error="Minimum donation is $5" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Cards</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Support Open Source</CardTitle>
              <CardDescription>Your contribution helps us maintain and improve Dividi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Custom Amount ($)</Label>
                  <Input id="amount" type="number" placeholder="100" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Donate Now</Button>
            </CardFooter>
          </Card>
        </section>
      </main>
    </div>
  )
}
