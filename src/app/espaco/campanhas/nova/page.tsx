'use client'

import { useActionState, useEffect, useState } from 'react'
import { createCampaignDraft } from '@/lib/campaigns/actions'

export default function NovaCampanhaPage() {
  const [state, formAction, isPending] = useActionState(createCampaignDraft, null)
  const [creationToken, setCreationToken] = useState('')

  useEffect(() => {
    setCreationToken(window.crypto.randomUUID())
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Nova Campanha</h1>
      
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="creation_token" value={creationToken} />

        {state?.error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {state?.fieldErrors?.title && (
            <p className="text-sm text-red-500">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Identificador URL (slug)</label>
          <input 
            type="text" 
            id="slug" 
            name="slug" 
            required 
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="minha-nova-campanha"
          />
          {state?.fieldErrors?.slug && (
            <p className="text-sm text-red-500">{state.fieldErrors.slug[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea 
            id="description" 
            name="description" 
            required 
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {state?.fieldErrors?.description && (
            <p className="text-sm text-red-500">{state.fieldErrors.description[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="attribution" className="block text-sm font-medium text-gray-700">Atribuição</label>
          <input 
            type="text" 
            id="attribution" 
            name="attribution" 
            required 
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da Organização visível na campanha"
          />
          {state?.fieldErrors?.attribution && (
            <p className="text-sm text-red-500">{state.fieldErrors.attribution[0]}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isPending || !creationToken}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Salvando...' : 'Criar Campanha'}
        </button>
      </form>
    </div>
  )
}
