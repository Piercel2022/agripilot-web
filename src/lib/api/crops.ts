import api from './client'
import type {
  CreateCropPayload,
  Crop,
  UpdateCropPayload,
} from '../../types/crop'

export async function getCrops(): Promise<Crop[]> {
  const response = await api.get<Crop[]>('/crops')
  return response.data
}

export async function createCrop(
  payload: CreateCropPayload,
): Promise<Crop> {
  const response = await api.post<Crop>('/crops', payload)
  return response.data
}

export async function updateCrop(
  id: string,
  payload: UpdateCropPayload,
): Promise<Crop> {
  const response = await api.patch<Crop>(`/crops/${id}`, payload)
  return response.data
}

export async function deleteCrop(id: string): Promise<void> {
  await api.delete(`/crops/${id}`)
}
