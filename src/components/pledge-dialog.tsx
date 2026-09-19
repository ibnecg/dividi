'use client';

import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pledgeSchema, type PledgeFormValues } from '@/lib/validations/campaign';
import { pledgeDonationAction } from '@/app/campaigns/[id]/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PledgeDialog({ item, campaignId }: { item: { id: string; quantity: number; description: string }; campaignId: string }) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PledgeFormValues>({
    resolver: zodResolver(pledgeSchema) as unknown as Resolver<PledgeFormValues>,
    defaultValues: {
      campaignItemId: item.id,
      quantity: 1,
      donorName: '',
      donorPhone: '',
      message: '',
    },
  });

  const onSubmit = async (data: PledgeFormValues) => {
    setError(null);
    const result = await pledgeDonationAction(campaignId, data);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      reset();
      router.refresh();
    }
  };

  return (
    <>
      <Button className="w-full mt-4" onClick={() => setOpen(true)}>
        Doar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border shadow-lg rounded-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <button 
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-4 pr-6">
                <h2 className="text-xl font-semibold tracking-tight">Doar {item.description}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha os dados abaixo para registrar sua intenção de doação.
                </p>
              </div>

              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive border border-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`qty-${item.id}`}>Quantidade (Máximo: {item.quantity}) *</Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="1"
                    max={item.quantity}
                    {...register('quantity')}
                  />
                  {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`name-${item.id}`}>Seu Nome (Opcional)</Label>
                  <Input id={`name-${item.id}`} {...register('donorName')} placeholder="Como gostaria de ser chamado?" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${item.id}`}>Telefone/Contato (Opcional)</Label>
                  <Input id={`phone-${item.id}`} {...register('donorPhone')} placeholder="(00) 00000-0000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`msg-${item.id}`}>Mensagem (Opcional)</Label>
                  <Textarea
                    id={`msg-${item.id}`}
                    {...register('message')}
                    placeholder="Deixe uma mensagem de apoio..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar Doação
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
