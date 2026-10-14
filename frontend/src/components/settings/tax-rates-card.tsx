import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Percent, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { TaxRate, TaxRatePayload } from '@/types/tax-rate'
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

const EMPTY_FORM: TaxRatePayload = { name: '', percent: 0, isActive: true }

export function TaxRatesCard() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaxRate | null>(null)
  const [form, setForm] = useState<TaxRatePayload>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null)

  const {
    data: taxRates,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tax-rates'],
    queryFn: async () => (await api.get<TaxRate[]>('/tax-rates')).data,
  })

  const createMutation = useMutation({
    mutationFn: (payload: TaxRatePayload) => api.post('/tax-rates', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
      toast.success('Tax rate created')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create tax rate')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaxRatePayload }) =>
      api.patch(`/tax-rates/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
      toast.success('Tax rate updated')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update tax rate')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tax-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
      toast.success('Tax rate deleted')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete tax rate')),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(taxRate: TaxRate) {
    setEditing(taxRate)
    setForm({ name: taxRate.name, percent: Number(taxRate.percent), isActive: taxRate.isActive })
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
            <Percent className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Tax Rates</CardTitle>
          </div>
          <CardDescription>
            Named tax rates available on the product form (e.g. "GST 5%", "GST 18%"). Disable a
            rate to hide it without affecting products already using it.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add Tax Rate
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load tax rates: {getErrorMessage(error, 'Something went wrong.')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {taxRates?.map((taxRate) => (
            <span
              key={taxRate.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-3 pr-1.5 text-sm"
            >
              {taxRate.name}{' '}
              <span className="text-muted-foreground">({Number(taxRate.percent)}%)</span>
              {!taxRate.isActive && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Disabled
                </span>
              )}
              <button
                onClick={() => openEdit(taxRate)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"
                title={`Edit ${taxRate.name}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={() => setDeleteTarget(taxRate)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title={`Remove ${taxRate.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Tax Rate' : 'Add Tax Rate'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax-rate-name">Name</Label>
              <Input
                id="tax-rate-name"
                required
                placeholder="e.g. GST 18%"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate-percent">Percent</Label>
              <Input
                id="tax-rate-percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={form.percent}
                onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">
                  Disabled rates won't show up on the product form.
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
                {editing ? 'Save changes' : 'Add tax rate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Products already using this rate will keep their current tax %, but it won't be
              selectable for new products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
