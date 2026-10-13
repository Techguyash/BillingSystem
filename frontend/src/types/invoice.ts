import type { Customer } from './customer'

export type InvoiceStatus = 'paid' | 'partial' | 'due' | 'void'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'credit'

export interface InvoiceItem {
  id: string
  productId: string
  productName: string
  quantity: string
  unitPrice: string
  taxRatePercent: string
  lineTotal: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: string
  method: PaymentMethod
  notes: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  branchId: string
  customerId: string | null
  customer: Customer | null
  status: InvoiceStatus
  paymentMethod: PaymentMethod
  subtotal: string
  taxTotal: string
  discountTotal: string
  totalAmount: string
  notes: string | null
  items: InvoiceItem[]
  payments: Payment[]
  createdAt: string
}

export interface CreateInvoicePayload {
  customerId?: string
  items: { productId: string; quantity: number; unitPrice?: number }[]
  paymentMethod?: PaymentMethod
  discountTotal?: number
  notes?: string
}

export interface RecordPaymentPayload {
  amount: number
  method: PaymentMethod
  notes?: string
}

export function getBalanceDue(invoice: Invoice): number {
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  return Math.max(Number(invoice.totalAmount) - paid, 0)
}
