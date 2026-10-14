export interface ProductComponent {
  id: string
  componentProductId: string
  componentProductName: string
  quantity: string
}

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
  isComposite: boolean
  components: ProductComponent[]
  customFields: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ProductComponentPayload {
  componentProductId: string
  quantity: number
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
  isComposite?: boolean
  components?: ProductComponentPayload[]
  customFields?: Record<string, unknown>
}
