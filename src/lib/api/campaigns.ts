import api from './client'
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from '../../types/campaign'

export async function getCampaigns(): Promise<Campaign[]> {
  const response = await api.get<Campaign[]>('/campaigns')
  return response.data
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<Campaign> {
  const response = await api.post<Campaign>('/campaigns', payload)
  return response.data
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<Campaign> {
  const response = await api.patch<Campaign>(`/campaigns/${id}`, payload)
  return response.data
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete(`/campaigns/${id}`)
}
