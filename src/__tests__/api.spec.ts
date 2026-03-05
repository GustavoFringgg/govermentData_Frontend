import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { fetchTenders, fetchCached } from '../services/api'
import type { Cached } from '../types/tender'

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

const mockCached: Cached = {
  data: [
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
  ],
  last_updated: '2026-03-05 13:44:17.911100',
}

describe('API service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchTenders', () => {
    it('returns Cached data from /api/tenders', async () => {
      getMockInstance().get.mockResolvedValue({ data: mockCached })

      const result = await fetchTenders()
      expect(result).toEqual(mockCached)
      expect(getMockInstance().get).toHaveBeenCalledWith('/api/tenders')
    })

    it('throws on network error', async () => {
      getMockInstance().get.mockRejectedValue(new Error('Network Error'))

      await expect(fetchTenders()).rejects.toThrow('Network Error')
    })
  })

  describe('fetchCached', () => {
    it('returns Cached data from /api/tenders/cached', async () => {
      getMockInstance().get.mockResolvedValue({ data: mockCached })

      const result = await fetchCached()
      expect(result).toEqual(mockCached)
      expect(getMockInstance().get).toHaveBeenCalledWith('/api/tenders/cached')
    })

    it('throws on network error', async () => {
      getMockInstance().get.mockRejectedValue(new Error('Network Error'))

      await expect(fetchCached()).rejects.toThrow('Network Error')
    })
  })
})
