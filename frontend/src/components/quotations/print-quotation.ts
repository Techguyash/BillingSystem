import type { Quotation } from '@/types/quotation'
import type { Business } from '@/types/business'
import { computeTaxBreakdown } from '@/lib/gst'

function buildQuotationHtml(quotation: Quotation, business?: Business) {
  const rows = quotation.items
    .map(
      (item) => `
        <tr>
          <td>${item.productName}</td>
          <td style="text-align:center">${Number(item.quantity)}</td>
          <td style="text-align:right">₹${Number(item.unitPrice).toFixed(2)}</td>
          <td style="text-align:right">₹${Number(item.lineTotal).toFixed(2)}</td>
        </tr>`,
    )
    .join('')

  const tax = computeTaxBreakdown(
    Number(quotation.taxTotal),
    business?.state,
    quotation.customer?.state,
  )
  const taxRows =
    tax.type === 'cgst_sgst'
      ? `<div><span>CGST</span><span>₹${tax.cgst!.toFixed(2)}</span></div>
         <div><span>SGST</span><span>₹${tax.sgst!.toFixed(2)}</span></div>`
      : `<div><span>IGST</span><span>₹${tax.igst!.toFixed(2)}</span></div>`

  const footer =
    (business?.settings.invoiceFooter as string | undefined) ||
    'Thank you for considering us!'
  const terms = business?.settings.invoiceTerms as string | undefined

  return `
    <html>
      <head>
        <title>${quotation.quotationNumber}</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; color: #111; max-width: 480px; margin: 0 auto; }
          h1 { font-size: 18px; margin: 0 0 2px; }
          h2 { font-size: 15px; margin: 16px 0 0; letter-spacing: 0.08em; text-transform: uppercase; color: #444; }
          .muted { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { text-align: left; border-bottom: 1px solid #ccc; padding: 6px 4px; font-size: 11px; text-transform: uppercase; color: #666; }
          td { padding: 6px 4px; border-bottom: 1px solid #eee; }
          .totals { margin-top: 12px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand { font-weight: 700; font-size: 16px; border-top: 1px solid #111; margin-top: 6px; padding-top: 6px; }
          .center { text-align: center; }
          .logo { max-width: 120px; max-height: 60px; margin: 0 auto 8px; display: block; }
          .badge { display: inline-block; margin-top: 6px; padding: 3px 10px; border: 1px solid #999; border-radius: 999px; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: #444; }
        </style>
      </head>
      <body>
        <div class="center">
          ${business?.settings.logoUrl ? `<img class="logo" src="${business.settings.logoUrl}" />` : ''}
          <h1>${business?.name ?? 'Billing System'}</h1>
          ${business?.address ? `<div class="muted">${business.address}</div>` : ''}
          ${business?.gstin ? `<div class="muted">GSTIN: ${business.gstin}</div>` : ''}
          <div class="badge">Quotation</div>
        </div>
        <hr />
        <div class="muted">
          Quotation #: <strong>${quotation.quotationNumber}</strong><br/>
          Date: ${new Date(quotation.createdAt).toLocaleString('en-IN')}<br/>
          ${quotation.validUntil ? `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-IN')}<br/>` : ''}
          Customer: ${quotation.customer?.name ?? 'Walk-in customer'}
          ${quotation.customer?.phone ? ` (${quotation.customer.phone})` : ''}
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th class="center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>₹${Number(quotation.subtotal).toFixed(2)}</span></div>
          ${taxRows}
          ${Number(quotation.discountTotal) > 0 ? `<div><span>Discount</span><span>-₹${Number(quotation.discountTotal).toFixed(2)}</span></div>` : ''}
          <div class="grand"><span>Total</span><span>₹${Number(quotation.totalAmount).toFixed(2)}</span></div>
        </div>
        ${quotation.notes ? `<p class="muted" style="margin-top:16px">${quotation.notes}</p>` : ''}
        ${terms ? `<p class="muted" style="margin-top:8px">${terms}</p>` : ''}
        <p class="center muted" style="margin-top:24px">${footer}</p>
        <p class="center muted" style="margin-top:4px">This is an estimate, not a tax invoice.</p>
      </body>
    </html>
  `
}

export function printQuotation(quotation: Quotation, business?: Business) {
  const printWindow = window.open('', '_blank', 'width=480,height=640')
  if (!printWindow) return
  printWindow.document.write(buildQuotationHtml(quotation, business))
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}
