/**
 * CGST+SGST applies when buyer and seller are in the same state (intra-state
 * sale); IGST applies across states (inter-state sale) — standard Indian GST
 * rule. We only have a single combined tax rate per product, so this just
 * splits the already-computed tax total for display purposes.
 */
export interface TaxBreakdown {
  type: 'cgst_sgst' | 'igst'
  cgst?: number
  sgst?: number
  igst?: number
}

export function computeTaxBreakdown(
  taxTotal: number,
  businessState?: string | null,
  customerState?: string | null,
): TaxBreakdown {
  const sameState =
    !!businessState &&
    !!customerState &&
    businessState.trim().toLowerCase() === customerState.trim().toLowerCase()

  // Default to intra-state (CGST+SGST) when we don't have enough info to
  // tell (e.g. walk-in customer with no state on file) — the safer default
  // for a single-location business is to assume local sales.
  if (sameState || !customerState) {
    return { type: 'cgst_sgst', cgst: taxTotal / 2, sgst: taxTotal / 2 }
  }
  return { type: 'igst', igst: taxTotal }
}
