export interface AuthOrganization {
  id: string
  name: string
  slug: string
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  organization: AuthOrganization
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  user: AuthUser
}

export interface RegisterOrganizationRequest {
  name: string
  slug: string
  email?: string
  phone?: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  organizationId: string
}

export interface RegisterResponse {
  user: AuthUser
}

export interface OrganizationResponse {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  createdAt: string
  updatedAt: string
}
