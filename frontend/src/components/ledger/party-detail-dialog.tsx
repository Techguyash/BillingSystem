import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Mail, MapPin, Phone, Receipt } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { LedgerEntry } from '@/types/ledger'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface PartyLike {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  gstin: string | null
}

interface PartyDetailDialogProps<T extends PartyLike> {
  party: T | null
  onClose: () => void
  onEdit: (party: T) => void
  /** "customers" | "suppliers" — matches the REST resource the ledger hangs off. */
  resource: 'customers' | 'suppliers'
  /** e.g. "Invoice" for customers, "Purchase" for suppliers — the entry type that counts as a sale/purchase. */
  transactionType: string
  positiveBalanceLabel: string
  negativeBalanceLabel: string
}

export function PartyDetailDialog<T extends PartyLike>({
  party,
  onClose,
  onEdit,
  resource,
  transactionType,
  positiveBalanceLabel,
  negativeBalanceLabel,
}: PartyDetailDialogProps<T>) {
  const { data: ledger, isLoading, isError, error } = useQuery({
    queryKey: [resource, party?.id, 'ledger'],
    queryFn: async () => (await api.get<LedgerEntry[]>(`/${resource}/${party!.id}/ledger`)).data,
    enabled: !!party,
  })

  const stats = useMemo(() => {
    if (!ledger) return null
    const transactions = ledger.filter((e) => e.type === transactionType)
    const totalTransacted = transactions.reduce((sum, e) => sum + Number(e.amount), 0)
    const paid = ledger
      .filter((e) => e.type === 'Payment')
      .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0)
    const currentBalance = ledger.length > 0 ? Number(ledger[ledger.length - 1].balance) : 0
    const lastDate = transactions.length > 0 ? transactions[transactions.length - 1].date : null
    return { totalTransacted, paid, currentBalance, lastDate, count: transactions.length }
  }, [ledger, transactionType])

  if (!party) return null

  return (
    <Dialog open={!!party} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{party.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
          {party.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {party.phone}
            </div>
          )}
          {party.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {party.email}
            </div>
          )}
          {party.address && (
            <div className="col-span-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {party.address}
            </div>
          )}
          {party.gstin && <div>GSTIN: {party.gstin}</div>}
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-3 rounded-lg bg-muted/50 p-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">{transactionType}s</div>
              <div className="text-base font-bold text-foreground">{stats.count}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total {transactionType}d</div>
              <div className="text-base font-bold text-foreground">₹{stats.totalTransacted.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Paid</div>
              <div className="text-base font-bold text-foreground">₹{stats.paid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                {stats.currentBalance >= 0 ? positiveBalanceLabel : negativeBalanceLabel}
              </div>
              <div
                className={`text-base font-bold ${stats.currentBalance > 0 ? 'text-amber-600' : 'text-foreground'}`}
              >
                ₹{Math.abs(stats.currentBalance).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" /> Transaction History
          </div>
          <div className="max-h-[28rem] space-y-3 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {isError && (
              <p className="text-sm text-destructive">
                Failed to load history: {getErrorMessage(error, 'Something went wrong.')}
              </p>
            )}
            {!isLoading && !isError && ledger && ledger.length <= 1 && (
              <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
            )}
            {ledger
              ?.filter((e) => e.date)
              .slice()
              .reverse()
              .map((entry, index) => (
                <div key={index} className="flex gap-3 border-l-2 border-border pl-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {entry.type}
                        {entry.reference ? ` — ${entry.reference}` : ''}
                      </span>
                      <span
                        className={`text-sm font-semibold ${Number(entry.amount) >= 0 ? 'text-foreground' : 'text-emerald-600'}`}
                      >
                        {Number(entry.amount) >= 0 ? '+' : ''}
                        {Number(entry.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.date && new Date(entry.date).toLocaleString('en-IN')} · Balance: ₹
                      {Number(entry.balance).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="gap-1.5" onClick={() => onEdit(party)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
