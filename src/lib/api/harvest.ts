import api from './client'
import type {
  CreateHarvestPayload,
  Harvest,
  UpdateHarvestPayload,
} from '../../types/harvest'

export async function getHarvests(): Promise<Harvest[]> {
  const response = await api.get<Harvest[]>('/harvests')

  return response.data
}

export async function getHarvest(id: string): Promise<Harvest> {
  const response = await api.get<Harvest>(`/harvests/${id}`)

  return response.data
}

export async function createHarvest(
  payload: CreateHarvestPayload,
): Promise<Harvest> {
  const response = await api.post<Harvest>('/harvests', payload)

  return response.data
}

export async function updateHarvest(
  id: string,
  payload: UpdateHarvestPayload,
): Promise<Harvest> {
  const response = await api.patch<Harvest>(
    `/harvests/${id}`,
    payload,
  )

  return response.data
}

export async function deleteHarvest(id: string): Promise<void> {
  await api.delete(`/harvests/${id}`)
}
