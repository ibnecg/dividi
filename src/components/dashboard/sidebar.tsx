'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Megaphone, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Sidebar({ orgName }: { orgName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const userName = session?.user?.name || session?.user?.email || 'Usuário';
  const initial = userName.charAt(0).toUpperCase();

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campanhas', href: '/dashboard/campaigns', icon: Megaphone },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Organization Header & Desktop Collapse Toggle */}
      <div className={cn(
        "h-14 border-b border-border flex items-center shrink-0",
        isCollapsed ? "justify-center px-0" : "px-4 justify-between"
      )}>
        {!isCollapsed && (
          <div className="font-semibold text-foreground truncate mr-2">
            {orgName}
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link 
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? link.name : undefined}
              className={cn(
                "flex items-center py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                isCollapsed ? "justify-center px-0" : "px-3"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{link.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Info and Logout */}
      <div className={cn("p-4 border-t border-border mt-auto", isCollapsed ? "items-center flex flex-col" : "")}>
        <div className={cn("flex items-center mb-4", isCollapsed ? "justify-center" : "px-2")}>
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0",
            isCollapsed ? "h-10 w-10 text-lg" : "h-8 w-8 mr-3"
          )} title={isCollapsed ? userName : undefined}>
            {initial}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-foreground truncate">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {session?.user?.email || 'N/A'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sair" : undefined}
          className={cn(
            "flex items-center text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors",
            isCollapsed ? "justify-center p-2 w-full" : "w-full px-2 py-2"
          )}
          aria-label="Sair da conta"
        >
          <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
      
      {/* Theme Switcher */}
      <div className={cn("px-4 pb-4 border-t-0", isCollapsed ? "px-2" : "")}>
        {!isCollapsed && (
          <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
            Tema
          </div>
        )}
        <ThemeToggle variant={isCollapsed ? 'cycle' : 'segmented'} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-40 w-full shrink-0">
        <div className="font-semibold text-foreground truncate">
          {orgName}
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -mr-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-3/4 sm:w-64 bg-background border-r border-border shadow-lg transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 p-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:block h-screen bg-background border-r border-border sticky top-0 shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {sidebarContent}
      </div>
    </>
  );
}
