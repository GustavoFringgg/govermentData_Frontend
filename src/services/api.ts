import axios from 'axios'
import type { Tender } from '../types/tender'

const apiClient = axios.create({
  baseURL: 'https://govermentdata-backend.onrender.com',
  timeout: 120000,
})

export async function fetchTenders(): Promise<Tender[]> {
  const response = await apiClient.get<Tender[]>('/api/tenders')
  return response.data
}
