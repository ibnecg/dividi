'use client';

import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar({ orgName }: { orgName: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
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

  return (
    <div className="w-64 bg-background border-r border-border h-screen flex flex-col">
      {/* Organization Header */}
      <div className="h-14 border-b border-border flex items-center px-4">
        <div className="font-semibold text-foreground truncate">
          {orgName}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <Link 
          href="/dashboard"
          className="flex items-center px-2 py-2 text-sm font-medium text-foreground bg-accent/50 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
        {/* More links can be added here in the future */}
      </div>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3 shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-foreground truncate">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {session?.user?.email || 'N/A'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
          aria-label="Sair da conta"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
