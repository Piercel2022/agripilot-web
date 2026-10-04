export type CampaignStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled'

export interface CampaignCrop {
  id: string
  name: string
  variety?: string
  season?: string
  field: {
    id: string
    name: string
    farm: {
      id: string
      name: string
    }
  }
}

export interface Campaign {
  id: string
  name: string
  season: string
  startDate?: string
  endDate?: string
  status: CampaignStatus
  notes?: string
  crop: CampaignCrop
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignPayload {
  name: string
  season: string
  startDate?: string
  endDate?: string
  status?: CampaignStatus
  notes?: string
  cropId: string
}

export type UpdateCampaignPayload = Partial<
  Omit<CreateCampaignPayload, 'cropId'>
>
