import api from './client'
import type {
  CreatePhytosanitaryPayload,
  PhytosanitaryTreatment,
  UpdatePhytosanitaryPayload,
} from '../../types/phytosanitary'

export const getPhytosanitaryTreatments = async (): Promise<
  PhytosanitaryTreatment[]
> => {
  const response = await api.get<PhytosanitaryTreatment[]>('/phytosanitary')
  return response.data
}

export const getPhytosanitaryTreatment = async (
  id: string,
): Promise<PhytosanitaryTreatment> => {
  const response = await api.get<PhytosanitaryTreatment>(
    `/phytosanitary/${id}`,
  )
  return response.data
}

export const createPhytosanitaryTreatment = async (
  payload: CreatePhytosanitaryPayload,
): Promise<PhytosanitaryTreatment> => {
  const response = await api.post<PhytosanitaryTreatment>(
    '/phytosanitary',
    payload,
  )
  return response.data
}

export const updatePhytosanitaryTreatment = async (
  id: string,
  payload: UpdatePhytosanitaryPayload,
): Promise<PhytosanitaryTreatment> => {
  const response = await api.patch<PhytosanitaryTreatment>(
    `/phytosanitary/${id}`,
    payload,
  )
  return response.data
}

export const deletePhytosanitaryTreatment = async (
  id: string,
): Promise<void> => {
  await api.delete(`/phytosanitary/${id}`)
}
