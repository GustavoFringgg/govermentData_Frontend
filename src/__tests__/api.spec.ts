import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { fetchTenders } from '../services/api'
import type { Tender } from '../types/tender'

vi.mock('axios', () => {
  const instance = {
    get: vi.fn(),
  }
  return {
    default: {
      create: vi.fn(() => instance),
      __instance: instance,
    },
  }
})

function getMockInstance() {
  return (axios as unknown as { __instance: { get: ReturnType<typeof vi.fn> } }).__instance
}

describe('API service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchTenders returns data from /api/tenders', async () => {
    const mockData: Tender[] = [
      {
        id: 1,
        agency_name: '測試機關',
        tender_name: '測試標案',
        tender_mode: '公開招標',
        procurement_nature: '財物類',
        announcement_date: '115/02/23',
        deadline: '115/02/25',
        budget: '1000000',
      },
    ]

    getMockInstance().get.mockResolvedValue({ data: mockData })

    const result = await fetchTenders()
    expect(result).toEqual(mockData)
    expect(getMockInstance().get).toHaveBeenCalledWith('/api/tenders')
  })

  it('fetchTenders throws on network error', async () => {
    getMockInstance().get.mockRejectedValue(new Error('Network Error'))

    await expect(fetchTenders()).rejects.toThrow('Network Error')
  })
})
