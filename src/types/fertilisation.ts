export type FertilisationType =
  | 'organic'
  | 'mineral'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'npk'
  | 'other'

export type FertilisationUnit =
  | 'kg'
  | 'tonne'
  | 'liter'
  | 'kg_per_hectare'

export type FertilisationApplicationMethod =
  | 'broadcast'
  | 'localized'
  | 'foliar'
  | 'fertigation'
  | 'other'

export type FertilisationStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface FertilisationIntervention {
  id: string
  name: string
  type: string
  scheduledDate?: string
  completedDate?: string
  status: string
  campaign: {
    id: string
    name: string
    season: string
    crop: {
      id: string
      name: string
      variety?: string
      field: {
        id: string
        name: string
        farm: {
          id: string
          name: string
        }
      }
    }
  }
}

export interface Fertilisation {
  id: string
  name: string
  product: string
  type: FertilisationType
  scheduledDate?: string
  completedDate?: string
  quantity?: string
  unit?: FertilisationUnit
  applicationMethod?: FertilisationApplicationMethod
  status: FertilisationStatus
  notes?: string
  intervention: FertilisationIntervention
  createdAt: string
  updatedAt: string
}

export interface CreateFertilisationPayload {
  name: string
  product: string
  type: FertilisationType
  scheduledDate?: string
  completedDate?: string
  quantity?: string
  unit?: FertilisationUnit
  applicationMethod?: FertilisationApplicationMethod
  status?: FertilisationStatus
  notes?: string
  interventionId: string
}

export type UpdateFertilisationPayload = Partial<
  Omit<CreateFertilisationPayload, 'interventionId'>
>
