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

export interface InvoiceCreditNote {
  id: string
  creditNoteNumber: string
  reason: string | null
  totalAmount: string
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
  discountId: string | null
  discountName: string | null
  totalAmount: string
  notes: string | null
  items: InvoiceItem[]
  payments: Payment[]
  creditNotes: InvoiceCreditNote[]
  createdAt: string
}

export interface CreateInvoicePayload {
  customerId?: string
  items: { productId: string; quantity: number; unitPrice?: number }[]
  paymentMethod?: PaymentMethod
  discountTotal?: number
  discountId?: string
  notes?: string
}

export interface RecordPaymentPayload {
  amount: number
  method: PaymentMethod
  notes?: string
}

/** Net of any returns — a refunded amount is no longer owed, same logic the backend applies. */
export function getReturnedTotal(invoice: Invoice): number {
  return invoice.creditNotes.reduce((sum, cn) => sum + Number(cn.totalAmount), 0)
}

export function getBalanceDue(invoice: Invoice): number {
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const effectiveOwed = Math.max(Number(invoice.totalAmount) - getReturnedTotal(invoice), 0)
  return Math.max(effectiveOwed - paid, 0)
}
