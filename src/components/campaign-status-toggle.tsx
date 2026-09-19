'use client';

import * as React from 'react';
import { toggleCampaignStatusAction } from '@/app/dashboard/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CampaignStatusToggleProps {
  campaignId: string;
  isActive: boolean;
  campaignName: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'outline' | 'ghost' | 'secondary';
  onStatusChange?: (newStatus: boolean) => void;
}

export function CampaignStatusToggle({
  campaignId,
  isActive,
  campaignName,
  size = 'sm',
  variant = 'outline',
  onStatusChange,
}: CampaignStatusToggleProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // Escape key handler for dialog accessibility
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleToggle = async (targetStatus: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await toggleCampaignStatusAction(campaignId, targetStatus);
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
        if (onStatusChange) {
          onStatusChange(targetStatus);
        }
        router.refresh();
      }
    } catch {
      setError('Erro ao alterar status da campanha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isActive ? (
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={isLoading}
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-destructive hover:border-destructive transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          title="Desativar campanha"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <PowerOff className="w-4 h-4 mr-1.5" />
          )}
          Desativar
        </Button>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={isLoading}
          onClick={() => handleToggle(true)}
          className="hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          title="Reativar campanha"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Power className="w-4 h-4 mr-1.5" />
          )}
          Reativar
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-dialog-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-background border border-border shadow-lg rounded-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/10 text-destructive rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 id="deactivate-dialog-title" className="text-lg font-semibold tracking-tight text-foreground">
                  Desativar Campanha
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja desativar a campanha{' '}
                  <span className="font-semibold text-foreground">&quot;{campaignName}&quot;</span>?
                  Ela será ocultada da listagem pública e deixará de receber novas doações.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive border border-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleToggle(false)}
                disabled={isLoading}
                className="focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Desativação
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
