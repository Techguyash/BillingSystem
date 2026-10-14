export interface StockHistoryEntry {
  date: string
  type: 'purchase' | 'adjustment'
  quantityDelta: string
  unitCost: string | null
  supplierName: string | null
  reason: string | null
  reference: string | null
}
