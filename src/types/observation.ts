export type ObservationType =
  | 'crop'
  | 'soil'
  | 'pest'
  | 'disease'
  | 'weather'
  | 'irrigation'
  | 'general'

export type ObservationSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export interface ObservationField {
  id: string
  name: string
  farm: {
    id: string
    name: string
  }
}

export interface Observation {
  id: string
  name: string
  type: ObservationType
  observedAt?: string
  severity?: ObservationSeverity
  description?: string
  notes?: string
  field: ObservationField
  createdAt: string
  updatedAt: string
}

export interface CreateObservationPayload {
  name: string
  type: ObservationType
  observedAt?: string
  severity?: ObservationSeverity
  description?: string
  notes?: string
  fieldId: string
}

export type UpdateObservationPayload = Partial<
  Omit<CreateObservationPayload, 'fieldId'>
>
