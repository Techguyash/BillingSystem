import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BadgePercent, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Discount, DiscountPayload, DiscountType } from '@/types/discount'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const EMPTY_FORM: DiscountPayload = { name: '', type: 'PERCENTAGE', value: 0, isActive: true }

const TYPE_ITEMS = { PERCENTAGE: 'Percentage (%)', FIXED: 'Fixed amount (₹)' }

function summarize(discount: Discount) {
  const amount =
    discount.type === 'PERCENTAGE' ? `${Number(discount.value)}%` : `₹${Number(discount.value).toFixed(2)}`
  const scope = discount.minOrderAmount
    ? ` on orders above ₹${Number(discount.minOrderAmount).toFixed(2)}`
    : ' on all orders'
  return `${amount}${scope}`
}

export function DiscountsCard() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [form, setForm] = useState<DiscountPayload>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null)

  const {
    data: discounts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => (await api.get<Discount[]>('/discounts')).data,
  })

  const createMutation = useMutation({
    mutationFn: (payload: DiscountPayload) => api.post('/discounts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('Discount created')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create discount')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DiscountPayload }) =>
      api.patch(`/discounts/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('Discount updated')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update discount')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/discounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('Discount deleted')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete discount')),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(discount: Discount) {
    setEditing(discount)
    setForm({
      name: discount.name,
      type: discount.type,
      value: Number(discount.value),
      minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : undefined,
      startDate: discount.startDate ?? undefined,
      endDate: discount.endDate ?? undefined,
      isActive: discount.isActive,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Discounts</CardTitle>
          </div>
          <CardDescription>
            Named discount rules billers can apply from a dropdown at checkout — e.g.
            "Festival Sale — 10% on all purchases" or "₹50 off orders above ₹500".
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add Discount
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load discounts: {getErrorMessage(error, 'Something went wrong.')}
          </p>
        )}
        {!isLoading && !isError && discounts?.length === 0 && (
          <p className="text-sm text-muted-foreground">No discounts configured yet.</p>
        )}
        {discounts?.map((discount) => (
          <div
            key={discount.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{discount.name}</span>
                {!discount.isActive && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Disabled
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {summarize(discount)}
                {(discount.startDate || discount.endDate) && (
                  <>
                    {' · '}
                    {discount.startDate ? new Date(discount.startDate).toLocaleDateString('en-IN') : 'Any time'}
                    {' – '}
                    {discount.endDate ? new Date(discount.endDate).toLocaleDateString('en-IN') : 'Ongoing'}
                  </>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Switch
                checked={discount.isActive}
                onCheckedChange={(checked) =>
                  updateMutation.mutate({
                    id: discount.id,
                    payload: {
                      name: discount.name,
                      type: discount.type,
                      value: Number(discount.value),
                      minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : undefined,
                      startDate: discount.startDate ?? undefined,
                      endDate: discount.endDate ?? undefined,
                      isActive: checked,
                    },
                  })
                }
              />
              <Button variant="ghost" size="icon" title="Edit discount" onClick={() => openEdit(discount)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Delete discount" onClick={() => setDeleteTarget(discount)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount-name">Name</Label>
              <Input
                id="discount-name"
                required
                placeholder="e.g. Festival Season Sale"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  items={TYPE_ITEMS}
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: (v as DiscountType) ?? 'PERCENTAGE' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">
                  Value {form.type === 'PERCENTAGE' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.type === 'PERCENTAGE' ? 100 : undefined}
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-min">Minimum order amount (optional)</Label>
              <Input
                id="discount-min"
                type="number"
                min="0"
                step="0.01"
                placeholder="Applies to all orders if left blank"
                value={form.minOrderAmount ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-start">Start date (optional)</Label>
                <Input
                  id="discount-start"
                  type="date"
                  value={form.startDate ?? ''}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-end">End date (optional)</Label>
                <Input
                  id="discount-end"
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">
                  Disabled discounts won't show up on the billing screen.
                </p>
              </div>
              <Switch
                checked={form.isActive ?? true}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {editing ? 'Save changes' : 'Create discount'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Invoices that already used this discount keep their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
