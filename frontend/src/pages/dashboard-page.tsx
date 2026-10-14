import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/auth-context'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Invoice } from '@/types/invoice'
import type { Product } from '@/types/product'
import type { Expense } from '@/types/expense'
import type { Business } from '@/types/business'
import type { PaymentMethodTotal, SalesSummary } from '@/types/report'

interface Summary {
  todaySales: number
  todayInvoiceCount: number
  productsInStock: number
  lowStockCount: number
  totalOutstanding: number
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
}

const PAYMENT_METHOD_COLORS = ['var(--brand)', 'var(--brand-mid)', 'var(--border)']

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function last7DaysRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return { from: toISODate(from), to: toISODate(to) }
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'brand-soft-bg brand-text',
  partial: 'bg-sky-50 text-sky-600',
  due: 'bg-amber-50 text-amber-600',
  void: 'bg-red-50 text-red-600',
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const navigate = useNavigate()

  const { data: business } = useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })
  const enabledModules = business?.settings.enabledModules
  const moduleEnabled = (key: string) => !enabledModules || enabledModules.includes(key)

  const {
    data: summary,
    isError: summaryError,
    error: summaryErrorDetail,
  } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => {
      const res = await api.get<Summary>('/reports/summary')
      return res.data
    },
  })

  const { data: invoices, isError: invoicesError } = useQuery({
    queryKey: ['invoices', 'recent'],
    queryFn: async () => {
      const res = await api.get<Invoice[]>('/invoices')
      return res.data.slice(0, 5)
    },
    enabled: moduleEnabled('invoices'),
  })

  const { data: lowStockProducts } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: async () => (await api.get<Product[]>('/reports/low-stock')).data,
    enabled: moduleEnabled('inventory'),
  })

  const weekRange = useMemo(() => last7DaysRange(), [])

  const { data: salesSummary } = useQuery({
    queryKey: ['reports', 'sales', weekRange.from, weekRange.to],
    queryFn: async () =>
      (
        await api.get<SalesSummary>('/reports/sales', {
          params: weekRange,
        })
      ).data,
    enabled: moduleEnabled('invoices'),
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['reports', 'payment-methods', weekRange.from, weekRange.to],
    queryFn: async () =>
      (
        await api.get<PaymentMethodTotal[]>('/reports/payment-methods', {
          params: weekRange,
        })
      ).data,
    enabled: moduleEnabled('invoices'),
  })

  // Expenses are their own permission (expense.manage), separate from
  // module toggles — only pull this (and show the KPI) for roles allowed
  // to see the Expenses page at all, so the dashboard never leaks a total
  // to someone who can't open /expenses themselves.
  const canViewExpenses = hasPermission('expense.manage')
  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => (await api.get<Expense[]>('/expenses')).data,
    enabled: canViewExpenses,
  })
  const expensesThisMonth = useMemo(() => {
    if (!expenses) return 0
    const now = new Date()
    return expenses
      .filter((e) => {
        const d = new Date(e.expenseDate)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)
  }, [expenses])

  const weeklyChartData = useMemo(
    () =>
      (salesSummary?.daily ?? []).map((d) => ({
        day: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
        sales: Number(d.sales),
      })),
    [salesSummary],
  )

  const kpis = [
    moduleEnabled('invoices') && {
      label: "Today's Sales",
      value: `₹${(summary?.todaySales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      description: 'Total value of invoices created today, net of any returns — excludes voided invoices.',
    },
    moduleEnabled('invoices') && {
      label: 'Invoices Today',
      value: String(summary?.todayInvoiceCount ?? 0),
      description: 'Number of invoices created today (voided invoices are not counted).',
    },
    moduleEnabled('invoices') && {
      label: 'Outstanding Dues',
      value: `₹${(summary?.totalOutstanding ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      alert: (summary?.totalOutstanding ?? 0) > 0,
      description: 'Total balance still owed across every unpaid or partially-paid invoice, net of returns.',
    },
    moduleEnabled('inventory') && {
      label: 'Products in Stock',
      value: String(summary?.productsInStock ?? 0),
      description: 'Count of active products currently in your catalog.',
    },
    moduleEnabled('inventory') && {
      label: 'Low Stock Alerts',
      value: String(summary?.lowStockCount ?? 0),
      alert: (summary?.lowStockCount ?? 0) > 0,
      description: 'Products whose stock quantity has dropped to or below their configured reorder level.',
    },
    canViewExpenses && {
      label: "This Month's Expenses",
      value: `₹${expensesThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      description: 'Sum of all non-inventory expenses (rent, salaries, utilities, etc.) recorded this calendar month.',
    },
  ].filter(
    (kpi): kpi is { label: string; value: string; alert?: boolean; description: string } => !!kpi,
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
        {moduleEnabled('billing') && (
          <Button className="gap-1.5" onClick={() => navigate('/billing')}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        )}
      </div>

      {summaryError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load dashboard metrics: {getErrorMessage(summaryErrorDetail, 'Something went wrong.')}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, alert, description }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="mb-1 flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground underline decoration-dotted underline-offset-2" />
                    }
                  >
                    {label}
                  </TooltipTrigger>
                  <TooltipContent>{description}</TooltipContent>
                </Tooltip>
                {alert && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-600">
                    Action needed
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart + payment methods */}
      {moduleEnabled('invoices') && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm">Revenue overview</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Last 7 days
              </p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold brand-text hover:underline"
            >
              Full reports →
            </button>
          </CardHeader>
          <CardContent>
            {weeklyChartData.every((d) => d.sales === 0) ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No sales in the last 7 days yet.
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData} barGap={4}>
                      <RechartsTooltip
                        cursor={{ fill: 'var(--muted)' }}
                        formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Sales']}
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="sales" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
                  {weeklyChartData.map((d, i) => (
                    <span key={i}>{d.day}</span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment methods</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            {!paymentMethods || paymentMethods.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <>
                <div className="relative mx-auto h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        dataKey="amount"
                        nameKey="method"
                        innerRadius={48}
                        outerRadius={66}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {paymentMethods.map((entry, i) => (
                          <Cell
                            key={entry.method}
                            fill={PAYMENT_METHOD_COLORS[i % PAYMENT_METHOD_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2.5 text-sm">
                  {paymentMethods.map((m, i) => (
                    <div key={m.method} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: PAYMENT_METHOD_COLORS[i % PAYMENT_METHOD_COLORS.length],
                          }}
                        />
                        {PAYMENT_METHOD_LABELS[m.method] ?? m.method}
                      </span>
                      <span className="font-semibold">{m.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Table + low stock */}
      {(moduleEnabled('invoices') || moduleEnabled('inventory')) && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {moduleEnabled('invoices') && (
        <Card className={moduleEnabled('inventory') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Recent Invoices</CardTitle>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs font-semibold brand-text hover:underline"
            >
              View all →
            </button>
          </CardHeader>
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!invoices || invoices.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No invoices yet. Create one from Billing / POS.
                    </TableCell>
                  </TableRow>
                )}
                {invoices?.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-6 font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="brand-soft-bg brand-text text-[10px] font-bold">
                            {initialsOf(inv.customer?.name ?? 'Walk-in')}
                          </AvatarFallback>
                        </Avatar>
                        {inv.customer?.name ?? 'Walk-in customer'}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(inv.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[inv.status]}`}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoicesError && (
              <p className="px-6 py-3 text-sm text-destructive">Failed to load recent invoices.</p>
            )}
          </CardContent>
        </Card>
        )}

        {moduleEnabled('inventory') && (
        <Card className={moduleEnabled('invoices') ? '' : 'lg:col-span-3'}>
          <CardHeader>
            <CardTitle className="text-sm">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(!lowStockProducts || lowStockProducts.length === 0) && (
              <p className="text-sm text-muted-foreground">
                All products are above their reorder level.
              </p>
            )}
            {lowStockProducts?.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Reorder at {Number(p.reorderLevel)}
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-600">
                  {Number(p.stockQty)} left
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        )}
      </div>
      )}
    </div>
  )
}
