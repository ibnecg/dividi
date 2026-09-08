import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import NovaCampanhaPage from '@/app/espaco/campanhas/nova/page'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: vi.fn().mockReturnValue([null, vi.fn(), false])
  }
})

test('renders Nova Campanha page correctly', () => {
  // Mock window.crypto.randomUUID since it is not natively available in jsdom
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: () => '12345678-1234-1234-1234-123456789012'
    }
  })

  render(<NovaCampanhaPage />)
  
  expect(screen.getByText('Nova Campanha')).toBeInTheDocument()
  expect(screen.getByLabelText('Título')).toBeInTheDocument()
  expect(screen.getByLabelText('Identificador URL (slug)')).toBeInTheDocument()
  expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
  expect(screen.getByLabelText('Atribuição')).toBeInTheDocument()
  
  const submitButton = screen.getByRole('button', { name: 'Criar Campanha' })
  expect(submitButton).toBeInTheDocument()
  expect(submitButton).not.toBeDisabled()
})
