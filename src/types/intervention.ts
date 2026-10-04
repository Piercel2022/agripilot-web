export type InterventionType =
  | 'sowing'
  | 'fertilization'
  | 'phytosanitary'
  | 'irrigation'
  | 'weeding'
  | 'soil_work'
  | 'harvest'
  | 'observation'

export type InterventionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface InterventionCampaign {
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

export interface Intervention {
  id: string
  name: string
  type: InterventionType
  scheduledDate?: string
  completedDate?: string
  status: InterventionStatus
  notes?: string
  campaign: InterventionCampaign
  createdAt: string
  updatedAt: string
}

export interface CreateInterventionPayload {
  name: string
  type: InterventionType
  scheduledDate?: string
  completedDate?: string
  status?: InterventionStatus
  notes?: string
  campaignId: string
}

export type UpdateInterventionPayload = Partial<
  Omit<CreateInterventionPayload, 'campaignId'>
>
