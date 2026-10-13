export interface Business {
  id: string
  name: string
  gstin: string | null
  email: string | null
  phone: string | null
  address: string | null
  state: string | null
  settings: {
    logoUrl?: string
    invoiceTerms?: string
    invoiceFooter?: string
    invoiceNumberPrefix?: string
    showHsnCodeOnInvoice?: boolean
    enabledModules?: string[]
    [key: string]: unknown
  }
}

export interface UpdateBusinessPayload {
  name?: string
  gstin?: string
  email?: string
  phone?: string
  address?: string
  state?: string
  logoUrl?: string
  invoiceTerms?: string
  invoiceFooter?: string
  invoiceNumberPrefix?: string
  showHsnCodeOnInvoice?: boolean
  enabledModules?: string[]
}

/** Keys match the sidebar nav routes they gate (see sidebar-nav.tsx). */
export const AVAILABLE_MODULES = [
  { key: 'billing', label: 'Billing / POS' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'customers', label: 'Customers' },
  { key: 'suppliers', label: 'Suppliers' },
  { key: 'reports', label: 'Reports' },
] as const
