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
  createdAt: string
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
