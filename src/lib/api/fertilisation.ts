import api from './client'
import type {
  CreateFertilisationPayload,
  Fertilisation,
  UpdateFertilisationPayload,
} from '../../types/fertilisation'

export const getFertilisations = async (): Promise<Fertilisation[]> => {
  const response = await api.get<Fertilisation[]>('/fertilisations')
  return response.data
}

export const getFertilisation = async (
  id: string,
): Promise<Fertilisation> => {
  const response = await api.get<Fertilisation>(`/fertilisations/${id}`)
  return response.data
}

export const createFertilisation = async (
  payload: CreateFertilisationPayload,
): Promise<Fertilisation> => {
  const response = await api.post<Fertilisation>('/fertilisations', payload)
  return response.data
}

export const updateFertilisation = async (
  id: string,
  payload: UpdateFertilisationPayload,
): Promise<Fertilisation> => {
  const response = await api.patch<Fertilisation>(
    `/fertilisations/${id}`,
    payload,
  )
  return response.data
}

export const deleteFertilisation = async (id: string): Promise<void> => {
  await api.delete(`/fertilisations/${id}`)
}
