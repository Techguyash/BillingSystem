import { Ban, Printer, RotateCcw, Wallet } from 'lucide-react'
import { getBalanceDue, type Invoice } from '@/types/invoice'
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
import { printReceipt } from '@/components/billing/receipt-dialog'
import { useAuth } from '@/context/auth-context'

const STATUS_STYLES: Record<string, string> = {
  paid: 'brand-soft-bg brand-text',
  partial: 'bg-sky-50 text-sky-600',
  due: 'bg-amber-50 text-amber-600',
  void: 'bg-red-50 text-red-600',
}

interface InvoiceDetailDialogProps {
  invoice: Invoice | null
  business?: Business
  onClose: () => void
  onRecordPayment: (invoice: Invoice) => void
  onVoid: (invoice: Invoice) => void
  onReturn: (invoice: Invoice) => void
}

export function InvoiceDetailDialog({
  invoice,
  business,
  onClose,
  onRecordPayment,
  onVoid,
  onReturn,
}: InvoiceDetailDialogProps) {
  if (!invoice) return null

  const balanceDue = getBalanceDue(invoice)

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {invoice.invoiceNumber}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[invoice.status]}`}
            >
              {invoice.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">{invoice.customer?.name ?? 'Walk-in customer'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-medium">{new Date(invoice.createdAt).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Payment Method</div>
            <div className="font-medium capitalize">{invoice.paymentMethod}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Balance Due</div>
            <div className={`font-medium ${balanceDue > 0 ? 'text-amber-600' : ''}`}>
              ₹{balanceDue.toFixed(2)}
            </div>
          </div>
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
                {invoice.items.map((item) => (
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
            <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>₹{Number(invoice.taxTotal).toFixed(2)}</span>
          </div>
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Discount{invoice.discountName ? ` (${invoice.discountName})` : ''}</span>
              <span>-₹{Number(invoice.discountTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {invoice.payments.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payments
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">
                      {p.method} · {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    <span className="font-medium">₹{Number(p.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {invoice.creditNotes.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Returns
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                {invoice.creditNotes.map((cn) => (
                  <div key={cn.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {cn.creditNoteNumber} · {new Date(cn.createdAt).toLocaleDateString('en-IN')}
                      {cn.reason ? ` · ${cn.reason}` : ''}
                    </span>
                    <span className="font-medium text-emerald-600">
                      -₹{Number(cn.totalAmount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => printReceipt(invoice, business)}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          {invoice.status !== 'void' && (
            <>
              <InvoiceDetailActions invoice={invoice} onRecordPayment={onRecordPayment} onVoid={onVoid} onReturn={onReturn} />
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Gates the mutating actions behind the same permissions the Invoices list page uses. */
function InvoiceDetailActions({
  invoice,
  onRecordPayment,
  onVoid,
  onReturn,
}: {
  invoice: Invoice
  onRecordPayment: (invoice: Invoice) => void
  onVoid: (invoice: Invoice) => void
  onReturn: (invoice: Invoice) => void
}) {
  const { hasPermission } = useAuth()
  const balanceDue = getBalanceDue(invoice)

  return (
    <>
      {hasPermission('credit_note.manage') && (
        <Button variant="outline" className="gap-1.5" onClick={() => onReturn(invoice)}>
          <RotateCcw className="h-4 w-4" /> Return Items
        </Button>
      )}
      {balanceDue > 0 && (
        <Button className="gap-1.5" onClick={() => onRecordPayment(invoice)}>
          <Wallet className="h-4 w-4" /> Record Payment
        </Button>
      )}
      <Button variant="destructive" className="gap-1.5" onClick={() => onVoid(invoice)}>
        <Ban className="h-4 w-4" /> Void
      </Button>
    </>
  )
}
