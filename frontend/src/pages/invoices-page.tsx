import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, Printer, RotateCcw, Wallet } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { getBalanceDue, type Invoice, type PaymentMethod } from '@/types/invoice'
import type { Business } from '@/types/business'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { printReceipt } from '@/components/billing/receipt-dialog'
import { CreateCreditNoteDialog } from '@/components/invoices/create-credit-note-dialog'
import { InvoiceDetailDialog } from '@/components/invoices/invoice-detail-dialog'
import { useAuth } from '@/context/auth-context'

const STATUS_STYLES: Record<string, string> = {
  paid: 'brand-soft-bg brand-text',
  partial: 'bg-sky-50 text-sky-600',
  due: 'bg-amber-50 text-amber-600',
  void: 'bg-red-50 text-red-600',
}

const STATUS_FILTERS = ['all', 'paid', 'partial', 'due', 'void'] as const

// See billing-page.tsx for why Base UI's Select needs an explicit items map.
const PAYMENT_METHOD_ITEMS = { cash: 'Cash', upi: 'UPI', card: 'Card' }

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>('all')
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null)
  const [returnTarget, setReturnTarget] = useState<Invoice | null>(null)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)

  const {
    data: invoices,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get<Invoice[]>('/invoices')).data,
  })

  const { data: business } = useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })

  const recordPayment = useMutation({
    mutationFn: ({ id, amount, method }: { id: string; amount: number; method: PaymentMethod }) =>
      api.post(`/invoices/${id}/payments`, { amount, method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'summary'] })
      toast.success('Payment recorded')
      setPaymentTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to record payment')),
  })

  const voidInvoice = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}/void`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'summary'] })
      toast.success('Invoice voided and stock restored')
      setVoidTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to void invoice')),
  })

  const filtered = useMemo(() => {
    if (!invoices) return []
    if (statusFilter === 'all') return invoices
    return invoices.filter((inv) => inv.status === statusFilter)
  }, [invoices, statusFilter])

  const detailInvoice = invoices?.find((inv) => inv.id === detailTargetId) ?? null

  function openPaymentDialog(invoice: Invoice) {
    setPaymentTarget(invoice)
    setPaymentAmount(getBalanceDue(invoice))
    setPaymentMethod('cash')
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentTarget || paymentAmount <= 0) return
    recordPayment.mutate({
      id: paymentTarget.id,
      amount: paymentAmount,
      method: paymentMethod,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            All sales, with payment status and collection tools.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="px-0 pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-destructive">
                    Failed to load invoices: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((inv) => {
                const balanceDue = getBalanceDue(inv)
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => setDetailTargetId(inv.id)}
                  >
                    <TableCell className="pl-6 font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="brand-soft-bg brand-text text-[10px] font-bold">
                            {initialsOf(inv.customer?.name ?? 'Walk-in')}
                          </AvatarFallback>
                        </Avatar>
                        {inv.customer?.name ?? 'Walk-in customer'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(inv.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {balanceDue > 0 ? (
                        <span className="font-semibold text-amber-600">
                          ₹{balanceDue.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[inv.status]}`}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print receipt"
                          onClick={() => printReceipt(inv, business)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {balanceDue > 0 && inv.status !== 'void' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Record payment"
                            onClick={() => openPaymentDialog(inv)}
                          >
                            <Wallet className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {inv.status !== 'void' && hasPermission('credit_note.manage') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Return items"
                            onClick={() => setReturnTarget(inv)}
                          >
                            <RotateCcw className="h-4 w-4 text-sky-600" />
                          </Button>
                        )}
                        {inv.status !== 'void' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Void invoice"
                            onClick={() => setVoidTarget(inv)}
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!paymentTarget} onOpenChange={(o) => !o && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {paymentTarget?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">
                Amount (balance due: ₹
                {paymentTarget ? getBalanceDue(paymentTarget).toFixed(2) : '0.00'})
              </Label>
              <Input
                id="pay-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                items={PAYMENT_METHOD_ITEMS}
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod((v as PaymentMethod) ?? 'cash')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!voidTarget} onOpenChange={(o) => !o && setVoidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void invoice {voidTarget?.invoiceNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This restores the sold items back into stock. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voidTarget && voidInvoice.mutate(voidTarget.id)}
            >
              Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateCreditNoteDialog invoice={returnTarget} onClose={() => setReturnTarget(null)} />

      <InvoiceDetailDialog
        invoice={detailInvoice}
        business={business}
        onClose={() => setDetailTargetId(null)}
        onRecordPayment={(inv) => {
          setDetailTargetId(null)
          openPaymentDialog(inv)
        }}
        onVoid={(inv) => {
          setDetailTargetId(null)
          setVoidTarget(inv)
        }}
        onReturn={(inv) => {
          setDetailTargetId(null)
          setReturnTarget(inv)
        }}
      />
    </div>
  )
}
