import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { PurchaseOrder } from '@/types/purchase'
import type { CreateDebitNotePayload, DebitNote } from '@/types/returns'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateDebitNoteDialogProps {
  purchaseOrder: PurchaseOrder | null
  onClose: () => void
}

export function CreateDebitNoteDialog({ purchaseOrder, onClose }: CreateDebitNoteDialogProps) {
  const queryClient = useQueryClient()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')

  const { data: existingDebitNotes } = useQuery({
    queryKey: ['debit-notes', 'by-purchase', purchaseOrder?.id],
    queryFn: async () =>
      (
        await api.get<DebitNote[]>('/debit-notes', {
          params: { purchaseOrderId: purchaseOrder!.id },
        })
      ).data,
    enabled: !!purchaseOrder,
  })

  useEffect(() => {
    setQuantities({})
    setReason('')
  }, [purchaseOrder?.id])

  const alreadyReturned = useMemo(() => {
    const map: Record<string, number> = {}
    existingDebitNotes?.forEach((dn) =>
      dn.items.forEach((item) => {
        map[item.purchaseOrderItemId] = (map[item.purchaseOrderItemId] ?? 0) + Number(item.quantity)
      }),
    )
    return map
  }, [existingDebitNotes])

  const createMutation = useMutation({
    mutationFn: (payload: CreateDebitNotePayload) => api.post('/debit-notes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debit-notes'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Return to supplier recorded and stock updated')
      onClose()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to record return')),
  })

  if (!purchaseOrder) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([purchaseOrderItemId, quantity]) => ({ purchaseOrderItemId, quantity }))
    if (items.length === 0) {
      toast.error('Enter a quantity to return for at least one item')
      return
    }
    createMutation.mutate({ purchaseOrderId: purchaseOrder!.id, items, reason: reason || undefined })
  }

  return (
    <Dialog open={!!purchaseOrder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Return to Supplier — {purchaseOrder.purchaseNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-5">Product</div>
              <div className="col-span-3">Purchased Qty</div>
              <div className="col-span-4">Return Qty</div>
            </div>
            {purchaseOrder.items.map((item) => {
              const remaining = Number(item.quantity) - (alreadyReturned[item.id] ?? 0)
              return (
                <div key={item.id} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-5 truncate text-sm">{item.productName}</div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {item.quantity}{' '}
                    {remaining < Number(item.quantity) && (
                      <span className="text-xs">({remaining} left to return)</span>
                    )}
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      min="0"
                      max={remaining}
                      step="0.001"
                      disabled={remaining <= 0}
                      value={quantities[item.id] ?? ''}
                      placeholder="0"
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: Math.min(Number(e.target.value) || 0, remaining),
                        }))
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="space-y-2">
            <Label htmlFor="debit-return-reason">Reason (optional)</Label>
            <Textarea
              id="debit-return-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Wrong item delivered"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Record Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
