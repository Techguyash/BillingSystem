import type { Supplier } from './supplier'

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  quantity: string
  unitCost: string
  taxRatePercent: string
  lineTotal: string
}

export interface SupplierPayment {
  id: string
  purchaseOrderId: string
  supplierId: string
  amount: string
  method: string
  notes: string | null
  createdAt: string
}

export interface PurchaseDebitNote {
  id: string
  debitNoteNumber: string
  reason: string | null
  totalAmount: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  purchaseNumber: string
  supplierId: string | null
  supplier: Supplier | null
  supplierInvoiceNumber: string | null
  subtotal: string
  taxTotal: string
  totalAmount: string
  notes: string | null
  items: PurchaseOrderItem[]
  payments: SupplierPayment[]
  debitNotes: PurchaseDebitNote[]
  createdAt: string
}

/** Net of any returns — a returned amount is no longer owed to the supplier, same logic the backend applies. */
export function getPurchaseReturnedTotal(purchaseOrder: PurchaseOrder): number {
  return purchaseOrder.debitNotes.reduce((sum, dn) => sum + Number(dn.totalAmount), 0)
}

export function getSupplierBalanceDue(purchaseOrder: PurchaseOrder): number {
  const paid = purchaseOrder.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const effectiveOwed = Math.max(Number(purchaseOrder.totalAmount) - getPurchaseReturnedTotal(purchaseOrder), 0)
  return Math.max(effectiveOwed - paid, 0)
}

export interface CreatePurchaseItemPayload {
  productId: string
  quantity: number
  unitCost: number
  taxRatePercent?: number
}

export interface CreatePurchaseOrderPayload {
  supplierId?: string
  supplierInvoiceNumber?: string
  items: CreatePurchaseItemPayload[]
  notes?: string
}

export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  quantityDelta: string
  reason: string
  createdAt: string
}

export interface CreateStockAdjustmentPayload {
  productId: string
  quantityDelta: number
  reason: string
}
