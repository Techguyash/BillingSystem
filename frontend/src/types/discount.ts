export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface Discount {
  id: string
  name: string
  type: DiscountType
  value: string
  minOrderAmount: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
}

export interface DiscountPayload {
  name: string
  type: DiscountType
  value: number
  minOrderAmount?: number
  startDate?: string
  endDate?: string
  isActive?: boolean
}
