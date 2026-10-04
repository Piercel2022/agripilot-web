import api from './client'
import type {
  CreateFieldPayload,
  Field,
  UpdateFieldPayload,
} from '../../types/field'

export async function getFields(): Promise<Field[]> {
  const response = await api.get<Field[]>('/fields')

  return response.data
}

export async function createField(
  payload: CreateFieldPayload,
): Promise<Field> {
  const response = await api.post<Field>('/fields', payload)

  return response.data
}

export async function updateField(
  id: string,
  payload: UpdateFieldPayload,
): Promise<Field> {
  const response = await api.patch<Field>(`/fields/${id}`, payload)

  return response.data
}

export async function deleteField(id: string): Promise<void> {
  await api.delete(`/fields/${id}`)
}
