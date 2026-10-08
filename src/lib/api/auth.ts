import api from './client'
import type {
  OrganizationResponse,
  RegisterOrganizationRequest,
  RegisterRequest,
  RegisterResponse,
} from '../../types/auth'

export async function createOrganization(
  payload: RegisterOrganizationRequest,
): Promise<OrganizationResponse> {
  const response = await api.post<OrganizationResponse>(
    '/organizations',
    payload,
  )

  return response.data
}

export async function register(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>(
    '/auth/register',
    payload,
  )

  return response.data
}
