export type TreatmentType =
  | 'fungicide'
  | 'herbicide'
  | 'insecticide'
  | 'acaricide'
  | 'molluscicide'
  | 'biocontrol'
  | 'other'

export type TreatmentUnit =
  | 'liter'
  | 'kg'
  | 'liter_per_hectare'
  | 'kg_per_hectare'
  | 'other'

export type ApplicationMethod =
  | 'foliar'
  | 'soil'
  | 'seed_treatment'
  | 'localized'
  | 'other'

export type PhytosanitaryStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface PhytosanitaryIntervention {
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

export interface PhytosanitaryTreatment {
  id: string
  name: string
  product: string
  activeIngredient?: string
  treatmentType: TreatmentType
  scheduledDate?: string
  completedDate?: string
  dose?: string
  unit?: TreatmentUnit
  target?: string
  applicationMethod?: ApplicationMethod
  status: PhytosanitaryStatus
  notes?: string
  intervention: PhytosanitaryIntervention
  createdAt: string
  updatedAt: string
}

export interface CreatePhytosanitaryPayload {
  name: string
  product: string
  activeIngredient?: string
  treatmentType: TreatmentType
  scheduledDate?: string
  completedDate?: string
  dose?: string
  unit?: TreatmentUnit
  target?: string
  applicationMethod?: ApplicationMethod
  status?: PhytosanitaryStatus
  notes?: string
  interventionId: string
}

export type UpdatePhytosanitaryPayload = Partial<
  Omit<CreatePhytosanitaryPayload, 'interventionId'>
>
