import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import * as React from 'react'

export default async function WorkspacePage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Verify membership and fetch organization
  const { data: memberData } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!memberData) {
    redirect('/setup')
  }

  const { data: orgData } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', memberData.organization_id)
    .single()

  if (!orgData) {
    redirect('/setup')
  }

  const userName = user.user_metadata?.name || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-muted">
      <header className="h-[64px] border-b border-border bg-background">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-md md:px-xl">
          <div className="font-heading truncate text-foreground">
            {orgData.name}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0" aria-label="Menu da conta">
                <Avatar className="h-11 w-11">
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            } />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <button type="submit" className="w-full text-left">
                  <DropdownMenuItem render={<span className="w-full cursor-pointer">Sair</span>} />
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-md py-3xl md:px-xl">
        <h1 className="text-heading text-foreground mb-sm">Seu espaço está pronto</h1>
        <p className="text-body text-muted-foreground mb-lg">
          Este é o espaço privado da sua organização.
        </p>
        <div className="text-body text-foreground">
          <strong>Organização:</strong> {orgData.name}
        </div>
        <div className="text-body text-foreground">
          <strong>Proprietário:</strong> {userName} ({user.email})
        </div>
      </main>
    </div>
  )
}
