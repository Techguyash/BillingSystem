import { Printer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getBalanceDue, type Invoice } from '@/types/invoice'
import type { Business } from '@/types/business'
import { computeTaxBreakdown } from '@/lib/gst'

function buildReceiptHtml(invoice: Invoice, business?: Business) {
  const rows = invoice.items
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
    Number(invoice.taxTotal),
    business?.state,
    invoice.customer?.state,
  )
  const taxRows =
    tax.type === 'cgst_sgst'
      ? `<div><span>CGST</span><span>₹${tax.cgst!.toFixed(2)}</span></div>
         <div><span>SGST</span><span>₹${tax.sgst!.toFixed(2)}</span></div>`
      : `<div><span>IGST</span><span>₹${tax.igst!.toFixed(2)}</span></div>`

  const balanceDue = getBalanceDue(invoice)
  const footer =
    (business?.settings.invoiceFooter as string | undefined) ||
    'Thank you for your business!'
  const terms = business?.settings.invoiceTerms as string | undefined

  return `
    <html>
      <head>
        <title>${invoice.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; padding: 24px; color: #111; max-width: 420px; margin: 0 auto; }
          h1 { font-size: 18px; margin: 0 0 2px; }
          .muted { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { text-align: left; border-bottom: 1px solid #ccc; padding: 6px 4px; font-size: 11px; text-transform: uppercase; color: #666; }
          td { padding: 6px 4px; border-bottom: 1px solid #eee; }
          .totals { margin-top: 12px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand { font-weight: 700; font-size: 16px; border-top: 1px solid #111; margin-top: 6px; padding-top: 6px; }
          .due { color: #b91c1c; font-weight: 700; }
          .center { text-align: center; }
          .logo { max-width: 120px; max-height: 60px; margin: 0 auto 8px; display: block; }
        </style>
      </head>
      <body>
        <div class="center">
          ${business?.settings.logoUrl ? `<img class="logo" src="${business.settings.logoUrl}" />` : ''}
          <h1>${business?.name ?? 'Billing System'}</h1>
          ${business?.address ? `<div class="muted">${business.address}</div>` : ''}
          ${business?.gstin ? `<div class="muted">GSTIN: ${business.gstin}</div>` : ''}
        </div>
        <hr />
        <div class="muted">
          Invoice: <strong>${invoice.invoiceNumber}</strong><br/>
          Date: ${new Date(invoice.createdAt).toLocaleString('en-IN')}<br/>
          Customer: ${invoice.customer?.name ?? 'Walk-in customer'}<br/>
          Payment: ${invoice.paymentMethod.toUpperCase()}
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th class="center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>₹${Number(invoice.subtotal).toFixed(2)}</span></div>
          ${taxRows}
          ${Number(invoice.discountTotal) > 0 ? `<div><span>Discount</span><span>-₹${Number(invoice.discountTotal).toFixed(2)}</span></div>` : ''}
          <div class="grand"><span>Total</span><span>₹${Number(invoice.totalAmount).toFixed(2)}</span></div>
          ${balanceDue > 0 ? `<div class="due"><span>Balance Due</span><span>₹${balanceDue.toFixed(2)}</span></div>` : ''}
        </div>
        ${terms ? `<p class="muted" style="margin-top:16px">${terms}</p>` : ''}
        <p class="center muted" style="margin-top:24px">${footer}</p>
      </body>
    </html>
  `
}

export function printReceipt(invoice: Invoice, business?: Business) {
  const printWindow = window.open('', '_blank', 'width=420,height=600')
  if (!printWindow) return
  printWindow.document.write(buildReceiptHtml(invoice, business))
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

interface ReceiptDialogProps {
  invoice: Invoice | null
  business?: Business
  onClose: () => void
}

export function ReceiptDialog({ invoice, business, onClose }: ReceiptDialogProps) {
  const tax = invoice
    ? computeTaxBreakdown(
        Number(invoice.taxTotal),
        business?.state,
        invoice.customer?.state,
      )
    : null
  const balanceDue = invoice ? getBalanceDue(invoice) : 0

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        {invoice && tax && (
          <>
            <DialogHeader>
              <DialogTitle>Invoice {invoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>{new Date(invoice.createdAt).toLocaleString('en-IN')}</div>
              <div>{invoice.customer?.name ?? 'Walk-in customer'}</div>
            </div>
            <Separator />
            <div className="max-h-56 space-y-2 overflow-y-auto text-sm">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.productName} × {Number(item.quantity)}
                  </span>
                  <span className="font-medium">
                    ₹{Number(item.lineTotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {tax.type === 'cgst_sgst' ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST</span>
                    <span>₹{tax.cgst!.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST</span>
                    <span>₹{tax.sgst!.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST</span>
                  <span>₹{tax.igst!.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between font-semibold text-destructive">
                  <span>Balance Due</span>
                  <span>₹{balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                New Sale
              </Button>
              <Button
                className="gap-1.5"
                onClick={() => printReceipt(invoice, business)}
              >
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
