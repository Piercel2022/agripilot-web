import api from './client'
import type {
  CreateFieldOperationPayload,
  FieldOperation,
  UpdateFieldOperationPayload,
} from '../../types/field-operation'

export async function getFieldOperations(): Promise<FieldOperation[]> {
  const response = await api.get<FieldOperation[]>('/field-operations')
  return response.data
}

export async function getFieldOperation(
  id: string,
): Promise<FieldOperation> {
  const response = await api.get<FieldOperation>(
    `/field-operations/${id}`,
  )
  return response.data
}

export async function createFieldOperation(
  payload: CreateFieldOperationPayload,
): Promise<FieldOperation> {
  const response = await api.post<FieldOperation>(
    '/field-operations',
    payload,
  )
  return response.data
}

export async function updateFieldOperation(
  id: string,
  payload: UpdateFieldOperationPayload,
): Promise<FieldOperation> {
  const response = await api.patch<FieldOperation>(
    `/field-operations/${id}`,
    payload,
  )
  return response.data
}

export async function deleteFieldOperation(id: string): Promise<void> {
  await api.delete(`/field-operations/${id}`)
}
