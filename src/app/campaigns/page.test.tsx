import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import CampaignsPage from './page'
import { db } from '@/db'

// Mock the db module
vi.mock('@/db', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    }
  }
})

describe('CampaignsPage', () => {
  it('renders empty state when there are no campaigns', async () => {
    // @ts-ignore - Mocking return value
    vi.mocked((db as any).orderBy).mockResolvedValueOnce([])

    const jsx = await CampaignsPage()
    render(jsx)

    expect(screen.getByText('Campanhas Solidárias')).toBeDefined()
    expect(screen.getByText('Não há campanhas ativas no momento.')).toBeDefined()
    expect(screen.getByText('Voltar para o Início')).toBeDefined()
  })

  it('renders campaigns when they exist', async () => {
    const mockCampaigns = [
      {
        id: '1',
        name: 'Campanha de Inverno',
        description: 'Doações de cobertores',
        imageUrl: 'http://example.com/image.jpg',
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Campanha de Alimentos',
        description: 'Cestas básicas',
        imageUrl: null,
        createdAt: new Date(),
      }
    ]

    // @ts-ignore - Mocking return value
    vi.mocked((db as any).orderBy).mockResolvedValueOnce(mockCampaigns)

    const jsx = await CampaignsPage()
    render(jsx)

    expect(screen.getByText('Campanha de Inverno')).toBeDefined()
    expect(screen.getByText('Doações de cobertores')).toBeDefined()
    expect(screen.getByText('Campanha de Alimentos')).toBeDefined()
    
    // Check if links exist
    const links = screen.getAllByRole('link')
    // We expect links for "Ver Detalhes"
    expect(links.length).toBe(2)
  })
})
