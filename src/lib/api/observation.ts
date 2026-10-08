import api from './client'
import type {
  CreateObservationPayload,
  Observation,
  UpdateObservationPayload,
} from '../../types/observation'

export async function getObservations(): Promise<Observation[]> {
  const response = await api.get<Observation[]>('/observations')

  return response.data
}

export async function getObservation(
  id: string,
): Promise<Observation> {
  const response = await api.get<Observation>(`/observations/${id}`)

  return response.data
}

export async function createObservation(
  payload: CreateObservationPayload,
): Promise<Observation> {
  const response = await api.post<Observation>('/observations', payload)

  return response.data
}

export async function updateObservation(
  id: string,
  payload: UpdateObservationPayload,
): Promise<Observation> {
  const response = await api.patch<Observation>(
    `/observations/${id}`,
    payload,
  )

  return response.data
}

export async function deleteObservation(id: string): Promise<void> {
  await api.delete(`/observations/${id}`)
}
