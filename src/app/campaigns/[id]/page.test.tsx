/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import CampaignDetailsPage from './page'
import { db } from '@/db'
import { notFound } from 'next/navigation'

// Mock the db module
vi.mock('@/db', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }
  }
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn().mockImplementation(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

describe('CampaignDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked((db as any).where).mockReset().mockReturnThis()
    vi.mocked((db as any).limit).mockReset().mockReturnThis()
  })

  it('calls notFound when campaign does not exist', async () => {
    vi.mocked((db as any).where).mockReturnValueOnce({ 
      limit: vi.fn().mockResolvedValueOnce([]) 
    } as any)

    await expect(CampaignDetailsPage({ params: Promise.resolve({ id: 'invalid-id' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('renders campaign details and items', async () => {
    const mockCampaign = {
      id: '1',
      name: 'Campanha de Inverno',
      description: 'Doações de cobertores',
      pixKey: '123.456.789-00',
      imageUrl: 'http://example.com/image.jpg',
      createdAt: new Date(),
    }

    const mockItems = [
      {
        id: '101',
        description: 'Cobertor Casal',
        amount: '50.00',
        imageUrl: null,
      },
      {
        id: '102',
        description: 'Meias',
        amount: null,
        imageUrl: null,
      }
    ]

    vi.mocked((db as any).where)
      .mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([mockCampaign]) } as any)
      .mockResolvedValueOnce(mockItems as any)

    const jsx = await CampaignDetailsPage({ params: Promise.resolve({ id: '1' }) })
    render(jsx)

    expect(screen.getByText('Campanha de Inverno')).toBeDefined()
    expect(screen.getByText('Doações de cobertores')).toBeDefined()
    expect(screen.getByText('123.456.789-00')).toBeDefined()
    expect(screen.getByText('Cobertor Casal')).toBeDefined()
    expect(screen.getByText(/50,00/)).toBeDefined()
    expect(screen.getByText('Meias')).toBeDefined()
  })

  it('renders empty state for items when none exist', async () => {
    const mockCampaign = {
      id: '1',
      name: 'Campanha Vazia',
      description: 'Sem itens listados',
      pixKey: null,
      imageUrl: null,
      createdAt: new Date(),
    }

    vi.mocked((db as any).where)
      .mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([mockCampaign]) } as any)
      .mockResolvedValueOnce([] as any)

    const jsx = await CampaignDetailsPage({ params: Promise.resolve({ id: '1' }) })
    render(jsx)

    expect(screen.getByText('Esta campanha não possui itens específicos listados no momento.')).toBeDefined()
  })
})
