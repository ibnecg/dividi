'use client';

import * as React from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pledgeSchema, type PledgeFormValues } from '@/lib/validations/campaign';
import { pledgeDonationAction } from '@/app/campaigns/[id]/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Copy, Check, QrCode, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generatePixPayload } from '@/lib/pix';

export interface PledgeDialogProps {
  item: {
    id: string;
    quantity: number;
    description: string;
    amount?: string | number | null;
  };
  campaignId: string;
  campaignName?: string;
  campaignPixKey?: string | null;
  requiresApproval?: boolean;
}

export function PledgeDialog({ item, campaignId, campaignName, campaignPixKey, requiresApproval = false }: PledgeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [donationStatus, setDonationStatus] = React.useState<'approved' | 'pending' | 'reversed' | null>(null);
  const [customAmount, setCustomAmount] = React.useState<string>('10,00');
  const router = useRouter();

  const hasFixedPrice = Boolean(item.amount && Number(item.amount) > 0);
  const unitPrice = hasFixedPrice ? Number(item.amount) : 0;

  const {
    control,
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

  const watchedQuantity = useWatch({ control, name: 'quantity' });
  const quantity = Number(watchedQuantity) || 1;

  // Calculate donation amount
  let calculatedAmount = 0;
  let customAmountError: string | null = null;

  if (hasFixedPrice) {
    calculatedAmount = unitPrice * quantity;
  } else {
    const cleaned = customAmount.replace(/\./g, '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    if (!customAmount.trim() || isNaN(parsed) || parsed < 1.0) {
      customAmountError = 'Informe um valor válido a partir de R$ 1,00';
      calculatedAmount = 0;
    } else {
      calculatedAmount = parsed;
    }
  }

  // Generate PIX payload dynamically
  const pixCode = React.useMemo(() => {
    if (!campaignPixKey || calculatedAmount < 1.0) {
      return '';
    }
    try {
      return generatePixPayload({
        pixKey: campaignPixKey,
        amount: calculatedAmount,
        merchantName: campaignName || 'DIVIDI',
      });
    } catch {
      return '';
    }
  }, [campaignPixKey, calculatedAmount, campaignName]);

  // Format currency for display
  const formattedTotal = React.useMemo(() => {
    if (calculatedAmount <= 0) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(calculatedAmount);
  }, [calculatedAmount]);

  // Copy to clipboard handler with fallback
  const handleCopy = async () => {
    if (!pixCode) return;

    let success = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(pixCode);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = pixCode;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        success = true;
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Keyboard accessibility (Esc to close)
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

  const handleClose = () => {
    setOpen(false);
    setIsSuccess(false);
    setDonationStatus(null);
    setError(null);
    reset();
    if (isSuccess) {
      router.refresh();
    }
  };

  const onSubmit = async (data: PledgeFormValues) => {
    setError(null);
    if (!hasFixedPrice && customAmountError) {
      setError(customAmountError);
      return;
    }
    
    const payload = {
      ...data,
      amount: hasFixedPrice ? undefined : calculatedAmount,
    };

    const result = await pledgeDonationAction(campaignId, payload);
    if (result?.error) {
      setError(result.error);
    } else {
      setDonationStatus(result.status || 'approved');
      setIsSuccess(true);
    }
  };

  return (
    <>
      <Button className="w-full mt-4" onClick={() => setOpen(true)}>
        Doar
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-background border border-border shadow-lg rounded-xl w-full max-w-lg my-8 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4 pr-6">
                <h2 id="dialog-title" className="text-xl font-semibold tracking-tight">
                  Doar {item.description}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Registre sua intenção de doação e efetue o pagamento com o código PIX exclusivo.
                </p>
              </div>

              {isSuccess ? (
                <div className="space-y-5">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      {donationStatus === 'pending' ? (
                        <>
                          <h3 className="font-semibold text-foreground">Doação reservada! Aguardando confirmação do organizador</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            O organizador tem até 72 horas para confirmar. Se não for confirmada, o item volta a ficar disponível. Utilize o código PIX abaixo para realizar o pagamento no seu banco:
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold text-foreground">Doação registrada com sucesso!</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sua intenção de doação foi confirmada. Utilize o código PIX abaixo para realizar o pagamento no seu banco:
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {formattedTotal && (
                    <div className="p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Valor total da doação:</span>
                      <span className="text-lg font-bold text-foreground">{formattedTotal}</span>
                    </div>
                  )}

                  {pixCode && (
                    <div className="space-y-3 p-4 bg-muted/40 border border-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <QrCode className="w-4 h-4" />
                        <span>PIX Copia e Cola</span>
                      </div>
                      <Textarea
                        readOnly
                        value={pixCode}
                        rows={3}
                        className="font-mono text-xs break-all bg-background resize-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label="Código PIX Copia e Cola"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-primary" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Código PIX</span>
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Abra o app do seu banco, escolha Pix &gt; Copia e Cola e cole o código.
                      </p>
                    </div>
                  )}

                  <Button className="w-full" onClick={handleClose}>
                    Concluir
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {requiresApproval && (
                    <div className="p-3 bg-muted border border-border rounded-md text-sm text-muted-foreground">
                      Esta campanha confirma as doações manualmente. Sua doação ficará reservada por até 72 horas aguardando a confirmação do organizador.
                    </div>
                  )}

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

                  {!hasFixedPrice && (
                    <div className="space-y-2">
                      <Label htmlFor={`custom-amount-${item.id}`}>Valor da Doação (R$) *</Label>
                      <Input
                        id={`custom-amount-${item.id}`}
                        type="text"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Ex: 50,00"
                      />
                      {customAmountError && <p className="text-sm text-destructive">{customAmountError}</p>}
                    </div>
                  )}

                  {formattedTotal && (
                    <div className="p-3 bg-muted/50 border border-border rounded-lg flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Valor total da doação:</span>
                      <span className="text-lg font-bold text-foreground">{formattedTotal}</span>
                    </div>
                  )}

                  {/* PIX Code display & copy area */}
                  {pixCode ? (
                    <div className="space-y-3 p-4 bg-muted/40 border border-border rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <QrCode className="w-4 h-4" />
                          PIX Copia e Cola
                        </span>
                        <span className="text-xs text-muted-foreground">Valor embutido</span>
                      </div>
                      <Textarea
                        readOnly
                        value={pixCode}
                        rows={2}
                        className="font-mono text-xs break-all bg-background resize-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label="Código PIX Copia e Cola"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-primary" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Código PIX</span>
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Abra o app do seu banco, escolha Pix &gt; Copia e Cola e cole o código.
                      </p>
                    </div>
                  ) : (
                    !hasFixedPrice && (
                      <div className="p-3 bg-muted/30 border border-border rounded-lg text-xs text-muted-foreground text-center">
                        Defina o valor da doação para gerar o código PIX.
                      </div>
                    )
                  )}

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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
