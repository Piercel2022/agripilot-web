export interface FieldFarm {
  id: string
  name: string
}

export interface Field {
  id: string
  name: string
  areaHectares: number
  soilType?: string
  cropType?: string
  notes?: string
  farm: FieldFarm
  createdAt: string
  updatedAt: string
}

export interface CreateFieldPayload {
  name: string
  areaHectares: number
  soilType?: string
  cropType?: string
  notes?: string
  farmId: string
}

export type UpdateFieldPayload = Partial<
  Omit<CreateFieldPayload, 'farmId'>
>
