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
