import { describe, it, expect, vi } from 'vitest'
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
    vi.mocked(db.orderBy).mockResolvedValueOnce([])

    const jsx = await CampaignsPage()
    render(jsx)

    expect(screen.getByText('Campanhas Solidárias')).toBeInTheDocument()
    expect(screen.getByText('Não há campanhas ativas no momento.')).toBeInTheDocument()
    expect(screen.getByText('Voltar para o Início')).toBeInTheDocument()
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
    vi.mocked(db.orderBy).mockResolvedValueOnce(mockCampaigns)

    const jsx = await CampaignsPage()
    render(jsx)

    expect(screen.getByText('Campanha de Inverno')).toBeInTheDocument()
    expect(screen.getByText('Doações de cobertores')).toBeInTheDocument()
    expect(screen.getByText('Campanha de Alimentos')).toBeInTheDocument()
    
    // Check if links exist
    const links = screen.getAllByRole('link')
    // We expect links for "Ver Detalhes"
    expect(links.length).toBe(2)
  })
})
