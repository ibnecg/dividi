import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCampaignDraft } from '@/lib/campaigns/actions'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/auth/require-user', () => ({
  requireUser: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('createCampaignDraft action', () => {
  let mockRpc: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRpc = vi.fn().mockResolvedValue({
      data: { id: 'mock-uuid' },
      error: null
    })
    
    vi.mocked(createClient).mockResolvedValue({
      rpc: mockRpc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('rejects empty input fields', async () => {
    const formData = new FormData()
    formData.append('title', '')
    formData.append('description', '')
    formData.append('attribution', '')
    formData.append('slug', '')
    formData.append('creation_token', '')

    const result = await createCampaignDraft(null, formData)
    
    expect(result.error).toBe('Campos inválidos. Por favor, verifique o formulário e tente novamente.')
    expect(result.fieldErrors).toBeDefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls RPC with validated data and redirects on success', async () => {
    const formData = new FormData()
    formData.append('title', 'Valid Title')
    formData.append('description', 'Valid Description')
    formData.append('attribution', 'Valid Org')
    formData.append('slug', 'valid-slug')
    formData.append('creation_token', '550e8400-e29b-41d4-a716-446655440000')

    const result = await createCampaignDraft(null, formData)
    console.log(result?.fieldErrors)
    
    expect(requireUser).toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('create_campaign_draft', {
      input_title: 'Valid Title',
      input_description: 'Valid Description',
      input_attribution: 'Valid Org',
      input_slug: 'valid-slug',
      input_creation_token: '550e8400-e29b-41d4-a716-446655440000'
    })
    
    expect(revalidatePath).toHaveBeenCalledWith('/espaco/campanhas')
    expect(redirect).toHaveBeenCalledWith('/espaco/campanhas/mock-uuid')
  })

  it('returns generic error if RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('DB Error') })
    
    const formData = new FormData()
    formData.append('title', 'Valid Title')
    formData.append('description', 'Valid Description')
    formData.append('attribution', 'Valid Org')
    formData.append('slug', 'valid-slug')
    formData.append('creation_token', '550e8400-e29b-41d4-a716-446655440000')

    const result = await createCampaignDraft(null, formData)
    
    expect(result?.error).toBe('Failed to save changes. Please try again.')
    expect(redirect).not.toHaveBeenCalled()
  })
})
