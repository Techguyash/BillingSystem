export interface DailyPoint {
  date: string
  sales: number
  invoiceCount: number
}

export interface SalesSummary {
  totalSales: number
  totalTax: number
  totalDiscount: number
  invoiceCount: number
  daily: DailyPoint[]
}

export interface GstSummary {
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
}

export interface ProductSales {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface PaymentMethodTotal {
  method: string
  amount: number
  percent: number
}
