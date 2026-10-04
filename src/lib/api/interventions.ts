import api from './client'
import type {
  CreateInterventionPayload,
  Intervention,
  UpdateInterventionPayload,
} from '../../types/intervention'

export async function getInterventions(): Promise<Intervention[]> {
  const response = await api.get<Intervention[]>('/interventions')
  return response.data
}

export async function getIntervention(
  id: string,
): Promise<Intervention> {
  const response = await api.get<Intervention>(`/interventions/${id}`)
  return response.data
}

export async function createIntervention(
  payload: CreateInterventionPayload,
): Promise<Intervention> {
  const response = await api.post<Intervention>('/interventions', payload)
  return response.data
}

export async function updateIntervention(
  id: string,
  payload: UpdateInterventionPayload,
): Promise<Intervention> {
  const response = await api.patch<Intervention>(
    `/interventions/${id}`,
    payload,
  )
  return response.data
}

export async function deleteIntervention(id: string): Promise<void> {
  await api.delete(`/interventions/${id}`)
}
