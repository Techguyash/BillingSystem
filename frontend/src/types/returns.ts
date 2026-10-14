export interface CreditNoteItem {
  id: string
  invoiceItemId: string
  productId: string
  productName: string
  quantity: string
  unitPrice: string
  taxRatePercent: string
  lineTotal: string
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  invoiceId: string
  customerId: string | null
  reason: string | null
  subtotal: string
  taxTotal: string
  totalAmount: string
  items: CreditNoteItem[]
  createdAt: string
}

export interface CreateCreditNotePayload {
  invoiceId: string
  items: { invoiceItemId: string; quantity: number }[]
  reason?: string
}

export interface DebitNoteItem {
  id: string
  purchaseOrderItemId: string
  productId: string
  productName: string
  quantity: string
  unitCost: string
  taxRatePercent: string
  lineTotal: string
}

export interface DebitNote {
  id: string
  debitNoteNumber: string
  purchaseOrderId: string
  supplierId: string | null
  reason: string | null
  subtotal: string
  taxTotal: string
  totalAmount: string
  items: DebitNoteItem[]
  createdAt: string
}

export interface CreateDebitNotePayload {
  purchaseOrderId: string
  items: { purchaseOrderItemId: string; quantity: number }[]
  reason?: string
}
