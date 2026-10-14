export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  gstin: string | null
  state: string | null
  openingBalance: string
  isActive: boolean
  customFields: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface SupplierFormValues {
  name: string
  phone?: string
  email?: string
  address?: string
  gstin?: string
  state?: string
  openingBalance?: number
  customFields?: Record<string, unknown>
}
