import { ArrowRightCircle, Printer, Trash2 } from 'lucide-react'
import type { Quotation, QuotationStatus } from '@/types/quotation'
import type { Business } from '@/types/business'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { printQuotation } from '@/components/quotations/print-quotation'

const STATUS_STYLES: Record<QuotationStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-sky-50 text-sky-600',
  accepted: 'brand-soft-bg brand-text',
  rejected: 'bg-red-50 text-red-600',
  expired: 'bg-amber-50 text-amber-600',
  converted: 'bg-violet-50 text-violet-600',
}

interface QuotationDetailDialogProps {
  quotation: Quotation | null
  business?: Business
  onClose: () => void
  onConvert: (quotation: Quotation) => void
  onDelete: (quotation: Quotation) => void
}

export function QuotationDetailDialog({
  quotation,
  business,
  onClose,
  onConvert,
  onDelete,
}: QuotationDetailDialogProps) {
  if (!quotation) return null

  return (
    <Dialog open={!!quotation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {quotation.quotationNumber}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[quotation.status]}`}
            >
              {quotation.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">{quotation.customer?.name ?? 'Walk-in customer'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-medium">{new Date(quotation.createdAt).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Valid Until</div>
            <div className="font-medium">
              {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
          {quotation.convertedInvoiceId && (
            <div>
              <div className="text-xs text-muted-foreground">Converted</div>
              <div className="font-medium text-violet-600">Yes — see Invoices</div>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Items
          </div>
          <div className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0">Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="pr-0 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-0">{item.productName}</TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>₹{Number(item.unitPrice).toFixed(2)}</TableCell>
                    <TableCell className="pr-0 text-right font-medium">
                      ₹{Number(item.lineTotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{Number(quotation.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>₹{Number(quotation.taxTotal).toFixed(2)}</span>
          </div>
          {Number(quotation.discountTotal) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>-₹{Number(quotation.discountTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>₹{Number(quotation.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {quotation.notes && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{quotation.notes}</p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => printQuotation(quotation, business)}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          {quotation.status !== 'converted' && (
            <>
              <Button variant="destructive" className="gap-1.5" onClick={() => onDelete(quotation)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <Button className="gap-1.5" onClick={() => onConvert(quotation)}>
                <ArrowRightCircle className="h-4 w-4" /> Convert to Invoice
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
