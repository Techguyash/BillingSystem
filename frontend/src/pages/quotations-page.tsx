import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRightCircle, Plus, Printer, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { Business } from '@/types/business'
import type { CreateQuotationPayload, Quotation, QuotationStatus } from '@/types/quotation'
import type { PaymentMethod } from '@/types/invoice'
import { printQuotation } from '@/components/quotations/print-quotation'
import { QuotationDetailDialog } from '@/components/quotations/quotation-detail-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { CustomerCombobox } from '@/components/billing/customer-combobox'

interface LineItem {
  productId: string
  quantity: number
  unitPrice: number
  taxRatePercent: number
}

const EMPTY_LINE: LineItem = { productId: '', quantity: 1, unitPrice: 0, taxRatePercent: 0 }

const STATUS_STYLES: Record<QuotationStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-sky-50 text-sky-600',
  accepted: 'brand-soft-bg brand-text',
  rejected: 'bg-red-50 text-red-600',
  expired: 'bg-amber-50 text-amber-600',
  converted: 'bg-violet-50 text-violet-600',
}

const PAYMENT_METHOD_ITEMS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  credit: 'Credit (Due)',
}

export function QuotationsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [convertTarget, setConvertTarget] = useState<Quotation | null>(null)
  const [convertMethod, setConvertMethod] = useState<PaymentMethod>('cash')
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }])

  const { data: quotations, isLoading, isError, error } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => (await api.get<Quotation[]>('/quotations')).data,
  })

  const { data: business } = useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })

  const detailQuotation = quotations?.find((q) => q.id === detailTargetId) ?? null

  const { data: products } = useQuery({
    queryKey: ['products', 'quotation-form'],
    queryFn: async () => {
      const res = await api.get<Product[]>('/products')
      return res.data.filter((p) => p.isActive)
    },
    enabled: dialogOpen,
  })

  const productItems = useMemo(() => {
    const map: Record<string, string> = {}
    products?.forEach((p) => {
      map[p.id] = p.name
    })
    return map
  }, [products])

  const createMutation = useMutation({
    mutationFn: (payload: CreateQuotationPayload) => api.post('/quotations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation created')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create quotation')),
  })

  const convertMutation = useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod: PaymentMethod }) =>
      api.post(`/quotations/${id}/convert`, { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Converted to invoice')
      setConvertTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to convert quotation')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation deleted')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete quotation')),
  })

  function openCreate() {
    setCustomer(null)
    setValidUntil('')
    setNotes('')
    setLines([{ ...EMPTY_LINE }])
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function selectProduct(index: number, productId: string) {
    const product = products?.find((p) => p.id === productId)
    updateLine(index, {
      productId,
      unitPrice: product ? Number(product.sellingPrice) : 0,
      taxRatePercent: product ? Number(product.taxRatePercent) : 0,
    })
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const totals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of lines) {
      const lineSubtotal = line.quantity * line.unitPrice
      subtotal += lineSubtotal
      taxTotal += (lineSubtotal * line.taxRatePercent) / 100
    }
    return { subtotal, taxTotal, total: subtotal + taxTotal }
  }, [lines])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validLines = lines.filter((l) => l.productId && l.quantity > 0)
    if (validLines.length === 0) {
      toast.error('Add at least one product line')
      return
    }
    createMutation.mutate({
      customerId: customer?.id,
      validUntil: validUntil || undefined,
      notes: notes || undefined,
      items: validLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Send estimates to customers, then convert accepted ones into invoices.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Quotation
        </Button>
      </div>

      <Card>
        <CardContent className="px-0 pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Quotation #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Total</TableHead>
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
                    Failed to load quotations: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && quotations?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No quotations yet. Create one to send an estimate to a customer.
                  </TableCell>
                </TableRow>
              )}
              {quotations?.map((q) => (
                <TableRow key={q.id} className="cursor-pointer" onClick={() => setDetailTargetId(q.id)}>
                  <TableCell className="pl-6 font-medium">{q.quotationNumber}</TableCell>
                  <TableCell>{q.customer?.name ?? 'Walk-in customer'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '—'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(q.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[q.status]}`}
                    >
                      {q.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Print quotation"
                      onClick={() => printQuotation(q, business)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {q.status !== 'converted' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Convert to invoice"
                        onClick={() => {
                          setConvertTarget(q)
                          setConvertMethod('cash')
                        }}
                      >
                        <ArrowRightCircle className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    {q.status !== 'converted' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(q.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Quotation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <CustomerCombobox value={customer} onChange={setCustomer} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-2">Tax %</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-5">
                    <Select
                      items={productItems}
                      value={line.productId}
                      onValueChange={(v) => selectProduct(index, v ?? '')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.taxRatePercent}
                      onChange={(e) =>
                        updateLine(index, { taxRatePercent: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={lines.length === 1}
                      onClick={() => removeLine(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertTarget} onOpenChange={(open) => !open && setConvertTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert {convertTarget?.quotationNumber} to Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                items={PAYMENT_METHOD_ITEMS}
                value={convertMethod}
                onValueChange={(v) => setConvertMethod((v as PaymentMethod) ?? 'cash')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_ITEMS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              This creates a real invoice using the quoted prices and decrements stock accordingly.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={convertMutation.isPending}
              onClick={() =>
                convertTarget &&
                convertMutation.mutate({ id: convertTarget.id, paymentMethod: convertMethod })
              }
            >
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuotationDetailDialog
        quotation={detailQuotation}
        business={business}
        onClose={() => setDetailTargetId(null)}
        onConvert={(q) => {
          setDetailTargetId(null)
          setConvertTarget(q)
          setConvertMethod('cash')
        }}
        onDelete={(q) => {
          setDetailTargetId(null)
          deleteMutation.mutate(q.id)
        }}
      />
    </div>
  )
}
