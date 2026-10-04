export type CropStatus =
  | 'planned'
  | 'active'
  | 'harvested'
  | 'cancelled'

export interface CropField {
  id: string
  name: string
  farm: {
    id: string
    name: string
  }
}

export interface Crop {
  id: string
  name: string
  variety?: string
  season?: string
  sowingDate?: string
  harvestDate?: string
  status: CropStatus
  notes?: string
  field: CropField
  createdAt: string
  updatedAt: string
}

export interface CreateCropPayload {
  name: string
  variety?: string
  season?: string
  sowingDate?: string
  harvestDate?: string
  status?: CropStatus
  notes?: string
  fieldId: string
}

export type UpdateCropPayload = Partial<
  Omit<CreateCropPayload, 'fieldId'>
>
