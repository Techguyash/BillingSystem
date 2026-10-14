import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PackagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product, ProductComponentPayload, ProductFormValues } from '@/types/product'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { ProductDetailDialog } from '@/components/inventory/product-detail-dialog'
import { DynamicCustomFields } from '@/components/settings/dynamic-custom-fields'
import { UnitSelect } from '@/components/inventory/unit-select'
import { TaxRateSelect } from '@/components/inventory/tax-rate-select'
import { usePrefillSearch } from '@/lib/use-prefill-search'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const EMPTY_FORM: ProductFormValues = {
  name: '',
  sku: '',
  unit: 'pcs',
  costPrice: 0,
  sellingPrice: 0,
  taxRatePercent: 0,
  stockQty: 0,
  reorderLevel: 0,
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = usePrefillSearch()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)
  const [detailTarget, setDetailTarget] = useState<Product | null>(null)

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get<Product[]>('/products', {
        params: search ? { search } : undefined,
      })
      return res.data
    },
  })

  // Candidates for a bundle's components — must themselves be simple
  // (non-composite) products, and can't include the product being edited.
  const componentCandidates = (products ?? []).filter(
    (p) => p.isActive && !p.isComposite && p.id !== editing?.id,
  )

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) => api.post('/products', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save product')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      api.patch(`/products/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update product')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deactivated')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to deactivate product')),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      unit: product.unit,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      taxRatePercent: Number(product.taxRatePercent),
      stockQty: Number(product.stockQty),
      reorderLevel: Number(product.reorderLevel),
      isComposite: product.isComposite,
      components: product.components.map((c) => ({
        componentProductId: c.componentProductId,
        quantity: Number(c.quantity),
      })),
      customFields: product.customFields ?? {},
    })
    setDialogOpen(true)
  }

  function addComponentLine() {
    setForm((prev) => ({
      ...prev,
      components: [...(prev.components ?? []), { componentProductId: '', quantity: 1 }],
    }))
  }

  function updateComponentLine(index: number, patch: Partial<ProductComponentPayload>) {
    setForm((prev) => ({
      ...prev,
      components: (prev.components ?? []).map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }))
  }

  function removeComponentLine(index: number) {
    setForm((prev) => ({
      ...prev,
      components: (prev.components ?? []).filter((_, i) => i !== index),
    }))
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.isComposite) {
      const validComponents = (form.components ?? []).filter((c) => c.componentProductId && c.quantity > 0)
      if (validComponents.length === 0) {
        toast.error('Add at least one component for this bundle')
        return
      }
    }
    const values: ProductFormValues = {
      ...form,
      components: form.isComposite
        ? (form.components ?? []).filter((c) => c.componentProductId && c.quantity > 0)
        : undefined,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, values })
    } else {
      createMutation.mutate(values)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog, pricing, and stock levels.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Tax %</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    Failed to load products: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No products yet. Add your first product to get started.
                  </TableCell>
                </TableRow>
              )}
              {products?.map((product) => {
                const lowStock =
                  Number(product.stockQty) <= Number(product.reorderLevel)
                return (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => setDetailTarget(product)}
                  >
                    <TableCell className="font-medium">
                      {product.name}
                      {product.isComposite && (
                        <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                          Bundle
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '—'}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>₹{Number(product.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell>{Number(product.taxRatePercent)}%</TableCell>
                    <TableCell>
                      {product.isComposite ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={
                            lowStock
                              ? 'font-semibold text-amber-600'
                              : 'text-foreground'
                          }
                        >
                          {Number(product.stockQty)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {!product.isComposite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Adjust stock"
                          onClick={() => setAdjustTarget(product)}
                        >
                          <PackagePlus className="h-4 w-4 text-sky-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit product"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Deactivate product"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <UnitSelect
                  id="unit"
                  value={form.unit}
                  onChange={(unit) => setForm({ ...form, unit })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRatePercent">Tax %</Label>
                <TaxRateSelect
                  id="taxRatePercent"
                  value={form.taxRatePercent}
                  onChange={(taxRatePercent) => setForm({ ...form, taxRatePercent })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQty">Stock Qty</Label>
                <Input
                  id="stockQty"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={form.isComposite}
                  value={form.isComposite ? '' : form.stockQty}
                  placeholder={form.isComposite ? 'Determined by components' : undefined}
                  onChange={(e) =>
                    setForm({ ...form, stockQty: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder At</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm({ ...form, reorderLevel: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">This is a bundle</p>
                <p className="text-xs text-muted-foreground">
                  Sold as one SKU, made up of other products. Selling a bundle decrements its
                  components' stock instead of its own.
                </p>
              </div>
              <Switch
                checked={!!form.isComposite}
                onCheckedChange={(checked) => setForm({ ...form, isComposite: checked })}
              />
            </div>

            {form.isComposite && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-7">Component Product</div>
                  <div className="col-span-3">Qty per bundle</div>
                  <div className="col-span-2"></div>
                </div>
                {(form.components ?? []).map((line, index) => (
                  <div key={index} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-7">
                      <Select
                        items={Object.fromEntries(componentCandidates.map((p) => [p.id, p.name]))}
                        value={line.componentProductId}
                        onValueChange={(v) => updateComponentLine(index, { componentProductId: v ?? '' })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {componentCandidates.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={line.quantity}
                        onChange={(e) =>
                          updateComponentLine(index, { quantity: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeComponentLine(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addComponentLine} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add component
                </Button>
              </div>
            )}

            <DynamicCustomFields
              entityType="product"
              values={form.customFields ?? {}}
              onChange={(customFields) => setForm({ ...form, customFields })}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {editing ? 'Save changes' : 'Create product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be hidden from billing but existing
              invoices will keep their history. This can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StockAdjustmentDialog
        product={adjustTarget}
        onClose={() => setAdjustTarget(null)}
      />

      <ProductDetailDialog
        product={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(p) => {
          setDetailTarget(null)
          openEdit(p)
        }}
        onAdjustStock={(p) => {
          setDetailTarget(null)
          setAdjustTarget(p)
        }}
      />
    </div>
  )
}
