'use client';

import * as React from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema, type CampaignFormValues } from '@/lib/validations/campaign';
import { createCampaignAction } from '@/app/dashboard/campaigns/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { upload } from '@vercel/blob/client';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export function CampaignForm() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema) as unknown as Resolver<CampaignFormValues>,
    defaultValues: {
      name: '',
      description: '',
      pixKey: '',
      imageUrl: '',
      items: [],
    },
  });

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
        access: 'public',
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

  const onSubmit = async (data: CampaignFormValues) => {
    setError(null);
    const result = await createCampaignAction(data);
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

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Campanha</CardTitle>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Itens da Campanha (Opcional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: '', amount: undefined, imageUrl: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="pt-6 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="Deixe em branco para valor livre"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Imagem do Item (Opcional)</Label>
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
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
        {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Campanha
      </Button>
    </form>
  );
}
