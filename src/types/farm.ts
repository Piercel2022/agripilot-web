export interface Farm {
  id: string
  name: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFarmPayload {
  name: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}

export type UpdateFarmPayload = Partial<CreateFarmPayload>