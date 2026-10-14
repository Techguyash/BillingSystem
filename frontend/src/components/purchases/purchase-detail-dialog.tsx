import { RotateCcw, Wallet } from 'lucide-react'
import { getSupplierBalanceDue, type PurchaseOrder } from '@/types/purchase'
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

interface PurchaseDetailDialogProps {
  purchaseOrder: PurchaseOrder | null
  onClose: () => void
  onRecordPayment: (po: PurchaseOrder) => void
  onReturn: (po: PurchaseOrder) => void
}

export function PurchaseDetailDialog({
  purchaseOrder,
  onClose,
  onRecordPayment,
  onReturn,
}: PurchaseDetailDialogProps) {
  if (!purchaseOrder) return null

  const balanceDue = getSupplierBalanceDue(purchaseOrder)

  return (
    <Dialog open={!!purchaseOrder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{purchaseOrder.purchaseNumber}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Supplier</div>
            <div className="font-medium">{purchaseOrder.supplier?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-medium">{new Date(purchaseOrder.createdAt).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Supplier Invoice #</div>
            <div className="font-medium">{purchaseOrder.supplierInvoiceNumber || '—'}</div>
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
                  <TableHead>Unit Cost</TableHead>
                  <TableHead className="pr-0 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-0">{item.productName}</TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>₹{Number(item.unitCost).toFixed(2)}</TableCell>
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
            <span>₹{Number(purchaseOrder.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>₹{Number(purchaseOrder.taxTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span>₹{Number(purchaseOrder.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {purchaseOrder.payments.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payments
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                {purchaseOrder.payments.map((p) => (
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

        {purchaseOrder.debitNotes.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Returns to Supplier
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                {purchaseOrder.debitNotes.map((dn) => (
                  <div key={dn.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {dn.debitNoteNumber} · {new Date(dn.createdAt).toLocaleDateString('en-IN')}
                      {dn.reason ? ` · ${dn.reason}` : ''}
                    </span>
                    <span className="font-medium text-emerald-600">
                      -₹{Number(dn.totalAmount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {purchaseOrder.notes && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onReturn(purchaseOrder)}>
            <RotateCcw className="h-4 w-4" /> Return to Supplier
          </Button>
          {balanceDue > 0 && purchaseOrder.supplierId && (
            <Button className="gap-1.5" onClick={() => onRecordPayment(purchaseOrder)}>
              <Wallet className="h-4 w-4" /> Record Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
