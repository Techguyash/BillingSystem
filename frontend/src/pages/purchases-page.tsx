import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'
import type { Supplier } from '@/types/supplier'
import type {
  CreatePurchaseOrderPayload,
  PurchaseOrder,
} from '@/types/purchase'
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

interface LineItem {
  productId: string
  quantity: number
  unitCost: number
  taxRatePercent: number
}

const EMPTY_LINE: LineItem = {
  productId: '',
  quantity: 1,
  unitCost: 0,
  taxRatePercent: 0,
}

export function PurchasesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [supplierId, setSupplierId] = useState<string>('none')
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }])

  const {
    data: purchases,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get<PurchaseOrder[]>('/purchases')).data,
  })

  const { data: products } = useQuery({
    queryKey: ['products', 'purchase-form'],
    queryFn: async () => {
      const res = await api.get<Product[]>('/products')
      return res.data.filter((p) => p.isActive)
    },
    enabled: dialogOpen,
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'purchase-form'],
    queryFn: async () => {
      const res = await api.get<Supplier[]>('/suppliers')
      return res.data.filter((s) => s.isActive)
    },
    enabled: dialogOpen,
  })

  // Base UI's <Select.Value> only shows the raw selected value unless Root
  // gets an `items` value->label map (see billing-page.tsx for details).
  const supplierItems = useMemo(() => {
    const map: Record<string, string> = { none: 'No supplier' }
    suppliers?.forEach((s) => {
      map[s.id] = s.name
    })
    return map
  }, [suppliers])

  const productItems = useMemo(() => {
    const map: Record<string, string> = {}
    products?.forEach((p) => {
      map[p.id] = p.name
    })
    return map
  }, [products])

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      api.post<PurchaseOrder>('/purchases', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Purchase order recorded, stock updated')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to record purchase')),
  })

  function openCreate() {
    setSupplierId('none')
    setSupplierInvoiceNumber('')
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
      unitCost: product ? Number(product.costPrice) : 0,
      taxRatePercent: product ? Number(product.taxRatePercent) : 0,
    })
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }])
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of lines) {
      const lineSubtotal = line.quantity * line.unitCost
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
      supplierId: supplierId === 'none' ? undefined : supplierId,
      supplierInvoiceNumber: supplierInvoiceNumber || undefined,
      notes: notes || undefined,
      items: validLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCost: l.unitCost,
        taxRatePercent: l.taxRatePercent,
      })),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Purchases
          </h1>
          <p className="text-sm text-muted-foreground">
            Record stock received from suppliers.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Purchase
        </Button>
      </div>

      <Card>
        <CardContent className="px-0 pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Purchase #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="pr-6">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    Failed to load purchases: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && purchases?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No purchases yet. Record stock received from a supplier to get started.
                  </TableCell>
                </TableRow>
              )}
              {purchases?.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="pl-6 font-medium">
                    {po.purchaseNumber}
                  </TableCell>
                  <TableCell>{po.supplier?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(po.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {po.items.length} item{po.items.length === 1 ? '' : 's'}
                  </TableCell>
                  <TableCell className="pr-6 font-semibold">
                    ₹{Number(po.totalAmount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  items={supplierItems}
                  value={supplierId}
                  onValueChange={(v) => setSupplierId(v ?? 'none')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier</SelectItem>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierInvoice">Supplier invoice #</Label>
                <Input
                  id="supplierInvoice"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="Optional reference"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit Cost</div>
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
                      onChange={(e) =>
                        updateLine(index, { quantity: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) =>
                        updateLine(index, { unitCost: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.taxRatePercent}
                      onChange={(e) =>
                        updateLine(index, {
                          taxRatePercent: Number(e.target.value) || 0,
                        })
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
                Record Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
