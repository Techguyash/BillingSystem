import type { Customer } from './customer'

export interface QuotationItem {
  id: string
  productId: string
  productName: string
  quantity: string
  unitPrice: string
  taxRatePercent: string
  lineTotal: string
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'

export interface Quotation {
  id: string
  quotationNumber: string
  customerId: string | null
  customer: Customer | null
  status: QuotationStatus
  validUntil: string | null
  subtotal: string
  taxTotal: string
  discountTotal: string
  totalAmount: string
  notes: string | null
  convertedInvoiceId: string | null
  items: QuotationItem[]
  createdAt: string
}

export interface CreateQuotationItemPayload {
  productId: string
  quantity: number
  unitPrice?: number
}

export interface CreateQuotationPayload {
  customerId?: string
  validUntil?: string
  items: CreateQuotationItemPayload[]
  discountTotal?: number
  notes?: string
}
