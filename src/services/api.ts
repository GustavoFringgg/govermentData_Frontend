import axios from 'axios'
import type { Tender } from '../types/tender'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 120000,
})

export async function fetchTenders(): Promise<Tender[]> {
  const response = await apiClient.get<Tender[]>('/api/tenders')
  return response.data
}
