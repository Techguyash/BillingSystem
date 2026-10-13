export interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  unit: string
  costPrice: string
  sellingPrice: string
  taxRatePercent: string
  stockQty: string
  reorderLevel: string
  isActive: boolean
  customFields: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ProductFormValues {
  name: string
  sku?: string
  barcode?: string
  unit: string
  costPrice: number
  sellingPrice: number
  taxRatePercent: number
  stockQty: number
  reorderLevel: number
  customFields?: Record<string, unknown>
}
