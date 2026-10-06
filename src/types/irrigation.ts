export type IrrigationMethod =
  | 'drip'
  | 'sprinkler'
  | 'pivot'
  | 'flood'
  | 'manual'
  | 'other'

export type IrrigationStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface IrrigationIntervention {
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

export interface Irrigation {
  id: string
  name: string
  method: IrrigationMethod
  scheduledDate?: string
  completedDate?: string
  durationMinutes?: number
  waterVolumeLiters?: string
  status: IrrigationStatus
  notes?: string
  intervention: IrrigationIntervention
  createdAt: string
  updatedAt: string
}

export interface CreateIrrigationPayload {
  name: string
  method: IrrigationMethod
  scheduledDate?: string
  completedDate?: string
  durationMinutes?: number
  waterVolumeLiters?: string
  status?: IrrigationStatus
  notes?: string
  interventionId: string
}

export type UpdateIrrigationPayload = Partial<
  Omit<CreateIrrigationPayload, 'interventionId'>
>
