export interface HarvestCrop {
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

export interface HarvestCampaign {
  id: string
  name: string
  season: string
}

export interface Harvest {
  id: string
  crop: HarvestCrop
  campaign: HarvestCampaign
  harvestDate: string
  quantity: number
  unit: string
  yield?: number
  quality?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateHarvestPayload {
  cropId: string
  campaignId: string
  harvestDate: string
  quantity: number
  unit: string
  yield?: number
  quality?: string
  notes?: string
}

export type UpdateHarvestPayload = Partial<CreateHarvestPayload>
