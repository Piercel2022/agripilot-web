import api from './client'
import type {
  CreateIrrigationPayload,
  Irrigation,
  UpdateIrrigationPayload,
} from '../../types/irrigation'

export const getIrrigations = async (): Promise<Irrigation[]> => {
  const response = await api.get<Irrigation[]>('/irrigations')
  return response.data
}

export const getIrrigation = async (
  id: string,
): Promise<Irrigation> => {
  const response = await api.get<Irrigation>(`/irrigations/${id}`)
  return response.data
}

export const createIrrigation = async (
  payload: CreateIrrigationPayload,
): Promise<Irrigation> => {
  const response = await api.post<Irrigation>('/irrigations', payload)
  return response.data
}

export const updateIrrigation = async (
  id: string,
  payload: UpdateIrrigationPayload,
): Promise<Irrigation> => {
  const response = await api.patch<Irrigation>(
    `/irrigations/${id}`,
    payload,
  )
  return response.data
}

export const deleteIrrigation = async (id: string): Promise<void> => {
  await api.delete(`/irrigations/${id}`)
}
