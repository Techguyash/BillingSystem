import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { downloadCsv } from '@/lib/csv'
import type { Expense, ExpensePayload } from '@/types/expense'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

const EMPTY_FORM: ExpensePayload = {
  category: '',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
}

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpensePayload>(EMPTY_FORM)

  const {
    data: expenses,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get<Expense[]>('/expenses')).data,
  })

  const total = useMemo(
    () => (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses],
  )

  const createMutation = useMutation({
    mutationFn: (payload: ExpensePayload) => api.post('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense recorded')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to record expense')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExpensePayload }) =>
      api.patch(`/expenses/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense updated')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to update expense')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense deleted')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to delete expense')),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setForm({
      category: expense.category,
      amount: Number(expense.amount),
      expenseDate: expense.expenseDate,
      description: expense.description ?? '',
      paymentMethod: expense.paymentMethod ?? '',
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track non-inventory costs like rent, salaries, and utilities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={!expenses?.length}
            onClick={() =>
              downloadCsv(
                'expenses.csv',
                ['Date', 'Category', 'Amount', 'Payment Method', 'Description'],
                (expenses ?? []).map((e) => [
                  e.expenseDate,
                  e.category,
                  e.amount,
                  e.paymentMethod ?? '',
                  e.description ?? '',
                ]),
              )
            }
          >
            Export CSV
          </Button>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Expenses
          </div>
          <div className="text-2xl font-bold text-foreground">
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">
                    Failed to load expenses: {getErrorMessage(error, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && expenses?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {expenses?.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="pl-6 text-muted-foreground">
                    {new Date(expense.expenseDate).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell className="font-medium">{expense.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.description || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {expense.paymentMethod || '—'}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(expense.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon" title="Edit expense" onClick={() => openEdit(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete expense"
                      onClick={() => setDeleteTarget(expense)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  required
                  placeholder="e.g. Rent"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  required
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Input
                  id="paymentMethod"
                  placeholder="e.g. Cash, UPI, Bank Transfer"
                  value={form.paymentMethod ?? ''}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {editing ? 'Save changes' : 'Add expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
