export interface TaxRate {
  id: string
  name: string
  percent: string
  isActive: boolean
}

export interface TaxRatePayload {
  name: string
  percent: number
  isActive?: boolean
}
