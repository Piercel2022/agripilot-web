export type FieldOperationStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface FieldOperationIntervention {
  id: string
  name: string
  type:
    | 'sowing'
    | 'fertilization'
    | 'phytosanitary'
    | 'irrigation'
    | 'weeding'
    | 'soil_work'
    | 'harvest'
    | 'observation'
  scheduledDate?: string
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

export interface FieldOperation {
  id: string
  intervention: FieldOperationIntervention
  startedAt?: string
  completedAt?: string
  durationMinutes?: number
  status: FieldOperationStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFieldOperationPayload {
  interventionId: string
  startedAt?: string
  completedAt?: string
  durationMinutes?: number
  status?: FieldOperationStatus
  notes?: string
}

export type UpdateFieldOperationPayload = Partial<
  Omit<CreateFieldOperationPayload, 'interventionId'>
>
