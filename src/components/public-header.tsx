'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function PublicHeader() {
  return (
    <header className="flex h-16 items-center px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mr-4 flex items-center">
        <Link href="/" className="font-bold text-xl tracking-tight text-foreground hover:opacity-80 transition-opacity">
          Dividi
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
        <nav className="hidden sm:flex items-center space-x-4">
          <Link href="/campaigns" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors">
            Campanhas
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors">
            Entrar
          </Link>
          <Link href="/signup">
            <Button size="sm">Criar Conta</Button>
          </Link>
        </nav>
        
        {/* Mobile quick links */}
        <div className="flex sm:hidden items-center space-x-2">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block mx-2" />
        
        <ThemeToggle variant="dropdown" />
      </div>
    </header>
  );
}
