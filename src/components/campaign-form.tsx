'use client';

import * as React from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations/campaign';
import { createCampaignAction, updateCampaignAction } from '@/app/dashboard/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { upload } from '@vercel/blob/client';
import { Plus, Trash2, Loader2, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';

interface CampaignFormProps {
  campaignId?: string;
  initialData?: CampaignFormValues;
}

export function CampaignForm({ campaignId, initialData }: CampaignFormProps = {}) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema) as unknown as Resolver<CampaignFormValues>,
    defaultValues: initialData || {
      name: '',
      description: '',
      pixKey: '',
      imageUrl: '',
      requiresDonationApproval: false,
      items: [],
    },
  });

  const campaignImageUrl = watch('imageUrl');
  const watchedItems = watch('items');
  const requiresApproval = watch('requiresDonationApproval');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      setError(null);
      const newBlob = await upload(file.name, file, {
        access: 'private',
        handleUploadUrl: '/api/upload',
      });

      if (index !== undefined) {
        setValue(`items.${index}.imageUrl`, newBlob.url);
      } else {
        setValue('imageUrl', newBlob.url);
      }
    } catch {
      setError('Erro ao enviar a imagem. Verifique o tamanho (máx 50kb).');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = 'Descrição,Valor,Quantidade\nExemplo de Item,50.00,2\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_itens_campanha.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Por favor, selecione um arquivo .csv válido.');
      setSuccess(null);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems = results.data as Array<Record<string, string>>;
        let importedCount = 0;

        if (results.meta.fields && !results.meta.fields.includes('Descrição')) {
          setError('O CSV deve conter pelo menos a coluna "Descrição".');
          setSuccess(null);
          return;
        }

        parsedItems.forEach((row) => {
          const description = row['Descrição']?.trim();
          if (!description) return;

          const amountStr = row['Valor']?.trim();
          const amount = amountStr ? parseFloat(amountStr.replace(',', '.')) : undefined;
          
          const qtyStr = row['Quantidade']?.trim();
          const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;

          append({
            description,
            amount: isNaN(amount as number) ? undefined : amount,
            quantity: isNaN(quantity) ? 1 : quantity,
            imageUrl: ''
          });
          importedCount++;
        });

        if (importedCount > 0) {
          setSuccess(`${importedCount} itens importados com sucesso!`);
          setError(null);
        } else {
          setError('Nenhum item válido encontrado no CSV.');
          setSuccess(null);
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        setError(`Erro ao ler o arquivo CSV: ${err.message}`);
        setSuccess(null);
      }
    });
  };

  const onSubmit = async (data: CampaignFormValues) => {
    setError(null);
    const result = campaignId
      ? await updateCampaignAction(campaignId, data)
      : await createCampaignAction(data);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 max-w-3xl mx-auto">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-800 border border-green-300 rounded-md">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{campaignId ? 'Editar Detalhes da Campanha' : 'Detalhes da Campanha'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha *</Label>
            <Input id="name" {...register('name')} placeholder="Ex: Ajude o Abrigo São Francisco" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Conte um pouco sobre a causa..."
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixKey">Chave PIX *</Label>
            <Input id="pixKey" {...register('pixKey')} placeholder="CPF, E-mail, Celular ou Chave Aleatória" />
            {errors.pixKey && <p className="text-sm text-destructive">{errors.pixKey.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignImage">Imagem da Campanha (Opcional, máx 50kb)</Label>
            {campaignImageUrl && (
              <div className="mb-2 relative w-36 h-24 rounded-md overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={campaignImageUrl} alt="Capa da campanha" className="w-full h-full object-cover" />
              </div>
            )}
            <Input
              id="campaignImage"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e)}
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmação de Doações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-ring"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setValue('requiresDonationApproval', false);
              }
            }}
          >
            <input
              type="radio"
              name="requiresDonationApproval"
              className="sr-only"
              checked={!requiresApproval}
              onChange={() => setValue('requiresDonationApproval', false, { shouldValidate: true })}
            />
            <div className={`w-4 h-4 rounded-full border border-primary mt-1 flex items-center justify-center shrink-0 ${!requiresApproval ? 'bg-primary' : ''}`}>
              {!requiresApproval && <div className="w-2 h-2 rounded-full bg-background" />}
            </div>
            <div>
              <p className="font-medium text-foreground">Aprovação automática</p>
              <p className="text-sm text-muted-foreground mt-1">A doação é registrada e o item baixado imediatamente.</p>
            </div>
          </label>

          <label
            className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-ring"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setValue('requiresDonationApproval', true);
              }
            }}
          >
            <input
              type="radio"
              name="requiresDonationApproval"
              className="sr-only"
              checked={requiresApproval}
              onChange={() => setValue('requiresDonationApproval', true, { shouldValidate: true })}
            />
            <div className={`w-4 h-4 rounded-full border border-primary mt-1 flex items-center justify-center shrink-0 ${requiresApproval ? 'bg-primary' : ''}`}>
              {requiresApproval && <div className="w-2 h-2 rounded-full bg-background" />}
            </div>
            <div>
              <p className="font-medium text-foreground">Requer minha aprovação</p>
              <p className="text-sm text-muted-foreground mt-1">O item é reservado e você tem 72h para aprovar ou reprovar. Sem resposta, a doação é estornada automaticamente.</p>
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-medium">Itens da Campanha (Opcional)</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadCsvTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Template CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleCsvUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', amount: undefined, quantity: 1, imageUrl: '' })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </div>
        
        {fields.map((field, index) => {
          const itemImageUrl = watchedItems?.[index]?.imageUrl;

          return (
            <Card key={field.id}>
              <CardContent className="pt-6 relative">
                {/* Keep existing item ID */}
                <input type="hidden" {...register(`items.${index}.id`)} />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Descrição do Item *</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Ex: Saco de Ração 15kg, ou Doação Livre"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Valor (Opcional - R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.amount`)}
                      placeholder="Livre se branco"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`items.${index}.quantity`)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-sm text-destructive">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label>Imagem do Item (Opcional)</Label>
                    {itemImageUrl && (
                      <div className="mb-2 relative w-20 h-20 rounded-md overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={itemImageUrl} alt="Imagem do item" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
        {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {campaignId ? 'Salvar Alterações' : 'Salvar Campanha'}
      </Button>
    </form>
  );
}
