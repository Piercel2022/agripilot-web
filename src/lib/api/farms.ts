import api from './client'
import type {
  CreateFarmPayload,
  Farm,
  UpdateFarmPayload,
} from '../../types/farm'

export async function getFarms(): Promise<Farm[]> {
  const response = await api.get<Farm[]>('/farms')

  return response.data
}

export async function createFarm(
  payload: CreateFarmPayload,
): Promise<Farm> {
  const response = await api.post<Farm>('/farms', payload)

  return response.data
}

export async function updateFarm(
  id: string,
  payload: UpdateFarmPayload,
): Promise<Farm> {
  const response = await api.patch<Farm>(`/farms/${id}`, payload)

  return response.data
}

export async function deleteFarm(id: string): Promise<void> {
  await api.delete(`/farms/${id}`)
}
