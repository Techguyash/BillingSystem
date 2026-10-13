import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'
import type { CreateStockAdjustmentPayload } from '@/types/purchase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StockAdjustmentDialogProps {
  product: Product | null
  onClose: () => void
}

const REASONS = [
  'Stocktake correction',
  'Damaged goods',
  'Theft/loss',
  'Expired',
  'Other',
]

// See billing-page.tsx for why Base UI's Select needs an explicit items map
// (REASONS doesn't need one since its values and labels are identical).
const DIRECTION_ITEMS = { decrease: 'Decrease stock', increase: 'Increase stock' }

export function StockAdjustmentDialog({ product, onClose }: StockAdjustmentDialogProps) {
  const queryClient = useQueryClient()
  const [direction, setDirection] = useState<'increase' | 'decrease'>('decrease')
  const [quantity, setQuantity] = useState(0)
  const [reason, setReason] = useState(REASONS[0])

  const mutation = useMutation({
    mutationFn: (payload: CreateStockAdjustmentPayload) =>
      api.post('/stock-adjustments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Stock adjusted')
      handleClose()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to adjust stock')),
  })

  function handleClose() {
    setDirection('decrease')
    setQuantity(0)
    setReason(REASONS[0])
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product || quantity <= 0) return
    mutation.mutate({
      productId: product.id,
      quantityDelta: direction === 'increase' ? quantity : -quantity,
      reason,
    })
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>Adjust Stock — {product.name}</DialogTitle>
              <DialogDescription>
                Current stock: {Number(product.stockQty)} {product.unit}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    items={DIRECTION_ITEMS}
                    value={direction}
                    onValueChange={(v) =>
                      setDirection((v as 'increase' | 'decrease') ?? 'decrease')
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decrease">Decrease stock</SelectItem>
                      <SelectItem value="increase">Increase stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adj-qty">Quantity</Label>
                  <Input
                    id="adj-qty"
                    type="number"
                    min="0.001"
                    step="0.001"
                    required
                    value={quantity || ''}
                    onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={(v) => setReason(v ?? REASONS[0])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending || quantity <= 0}>
                  Save Adjustment
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
