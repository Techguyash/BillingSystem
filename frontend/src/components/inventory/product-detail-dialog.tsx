import { useQuery } from '@tanstack/react-query'
import { Pencil, PackagePlus, ShoppingCart } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'
import type { StockHistoryEntry } from '@/types/stock-history'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ProductDetailDialogProps {
  product: Product | null
  onClose: () => void
  onEdit: (product: Product) => void
  onAdjustStock: (product: Product) => void
}

export function ProductDetailDialog({ product, onClose, onEdit, onAdjustStock }: ProductDetailDialogProps) {
  const { data: history, isLoading, isError, error } = useQuery({
    queryKey: ['products', product?.id, 'stock-history'],
    queryFn: async () =>
      (await api.get<StockHistoryEntry[]>(`/products/${product!.id}/stock-history`)).data,
    enabled: !!product,
  })

  if (!product) return null

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.name}
            {product.isComposite && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                Bundle
              </span>
            )}
            {!product.isActive && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Inactive
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">SKU</div>
            <div className="font-medium">{product.sku || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Barcode</div>
            <div className="font-medium">{product.barcode || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Unit</div>
            <div className="font-medium">{product.unit}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Selling Price</div>
            <div className="font-medium">₹{Number(product.sellingPrice).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cost Price</div>
            <div className="font-medium">₹{Number(product.costPrice).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Tax Rate</div>
            <div className="font-medium">{Number(product.taxRatePercent)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Current Stock</div>
            <div className="font-medium">{product.isComposite ? '—' : Number(product.stockQty)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Reorder Level</div>
            <div className="font-medium">{product.isComposite ? '—' : Number(product.reorderLevel)}</div>
          </div>
        </div>

        {product.isComposite && product.components.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bundle Components
              </div>
              <div className="space-y-1.5 text-sm">
                {product.components.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span>{c.componentProductName}</span>
                    <span className="font-medium text-muted-foreground">× {Number(c.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <ShoppingCart className="h-3.5 w-3.5" /> Stock Refill History
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {isError && (
              <p className="text-sm text-destructive">
                Failed to load history: {getErrorMessage(error, 'Something went wrong.')}
              </p>
            )}
            {!isLoading && !isError && history?.length === 0 && (
              <p className="text-sm text-muted-foreground">No purchases or adjustments recorded yet.</p>
            )}
            {history?.map((entry, index) => {
              const delta = Number(entry.quantityDelta)
              const isPurchase = entry.type === 'purchase'
              return (
                <div key={index} className="flex gap-3 border-l-2 border-border pl-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {isPurchase ? `Purchase ${entry.reference ?? ''}` : 'Manual Adjustment'}
                      </span>
                      <span
                        className={`text-sm font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}
                      >
                        {delta >= 0 ? '+' : ''}
                        {delta}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleString('en-IN')}
                      {isPurchase && entry.supplierName && ` · ${entry.supplierName}`}
                      {isPurchase && entry.unitCost && ` · ₹${Number(entry.unitCost).toFixed(2)} / unit`}
                      {!isPurchase && entry.reason && ` · ${entry.reason}`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!product.isComposite && (
            <Button variant="outline" className="gap-1.5" onClick={() => onAdjustStock(product)}>
              <PackagePlus className="h-4 w-4" /> Adjust Stock
            </Button>
          )}
          <Button className="gap-1.5" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" /> Edit Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
