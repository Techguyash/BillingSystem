import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'
import { getErrorMessage } from '@/lib/errors'
import type {
  GstSummary,
  PaymentMethodTotal,
  ProductSales,
  SalesSummary,
} from '@/types/report'
import type { Product } from '@/types/product'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

const QUICK_RANGES = [
  { label: '7D', days: 6 },
  { label: '30D', days: 29 },
  { label: '90D', days: 89 },
]

export function ReportsPage() {
  const [to, setTo] = useState(() => toISODate(new Date()))
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return toISODate(d)
  })

  function applyQuickRange(days: number) {
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    setTo(toISODate(toDate))
    setFrom(toISODate(fromDate))
  }

  const params = { from, to }

  const {
    data: sales,
    isError: salesError,
    error: salesErrorDetail,
  } = useQuery({
    queryKey: ['reports', 'sales', from, to],
    queryFn: async () => (await api.get<SalesSummary>('/reports/sales', { params })).data,
  })

  // retry: false — a 403 here means the user lacks reports.view_gst (a
  // separate permission from reports.view), so we just hide the card
  // instead of showing an error (see the `{gst && (...)}` check below).
  const { data: gst } = useQuery({
    queryKey: ['reports', 'gst', from, to],
    queryFn: async () => (await api.get<GstSummary>('/reports/gst', { params })).data,
    retry: false,
  })

  const {
    data: topProducts,
    isError: topProductsError,
    error: topProductsErrorDetail,
  } = useQuery({
    queryKey: ['reports', 'top-products', from, to],
    queryFn: async () =>
      (await api.get<ProductSales[]>('/reports/top-products', { params: { ...params, limit: 10 } }))
        .data,
  })

  const {
    data: paymentMethods,
    isError: paymentMethodsError,
    error: paymentMethodsErrorDetail,
  } = useQuery({
    queryKey: ['reports', 'payment-methods', from, to],
    queryFn: async () =>
      (await api.get<PaymentMethodTotal[]>('/reports/payment-methods', { params })).data,
  })

  const {
    data: lowStock,
    isError: lowStockError,
    error: lowStockErrorDetail,
  } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: async () => (await api.get<Product[]>('/reports/low-stock')).data,
  })

  const chartData = useMemo(
    () =>
      (sales?.daily ?? []).map((d) => ({
        date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: Number(d.sales),
      })),
    [sales],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales, GST, and inventory insights for a date range.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyQuickRange(r.days)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">
              From
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">
              To
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              min={from}
              max={toISODate(new Date())}
              onChange={(e) => setTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Sales
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{(sales?.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tax Collected
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{(sales?.totalTax ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Discounts Given
            </div>
            <div className="text-2xl font-bold text-foreground">
              ₹{(sales?.totalDiscount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Invoices
            </div>
            <div className="text-2xl font-bold text-foreground">{sales?.invoiceCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Sales Trend</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!sales?.daily?.length}
            onClick={() =>
              downloadCsv(
                `sales-trend-${from}-to-${to}.csv`,
                ['Date', 'Sales', 'Invoice Count'],
                (sales?.daily ?? []).map((d) => [d.date, d.sales, d.invoiceCount]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {salesError ? (
            <div className="flex h-64 items-center justify-center text-sm text-destructive">
              Failed to load sales data: {getErrorMessage(salesErrorDetail, 'Something went wrong.')}
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
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
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* GST summary */}
        {gst && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">GST Summary</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  downloadCsv(
                    `gst-summary-${from}-to-${to}.csv`,
                    ['Metric', 'Amount'],
                    [
                      ['Taxable Value', gst.taxableValue],
                      ['CGST', gst.cgst],
                      ['SGST', gst.sgst],
                      ['IGST', gst.igst],
                      ['Total Tax', gst.totalTax],
                    ],
                  )
                }
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Value</span>
                <span className="font-medium text-foreground">
                  ₹{Number(gst.taxableValue).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST</span>
                <span className="font-medium text-foreground">₹{Number(gst.cgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST</span>
                <span className="font-medium text-foreground">₹{Number(gst.sgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IGST</span>
                <span className="font-medium text-foreground">₹{Number(gst.igst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                <span>Total Tax</span>
                <span>₹{Number(gst.totalTax).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment methods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Payment Methods</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!paymentMethods?.length}
              onClick={() =>
                downloadCsv(
                  `payment-methods-${from}-to-${to}.csv`,
                  ['Method', 'Amount', 'Percent'],
                  (paymentMethods ?? []).map((m) => [
                    PAYMENT_METHOD_LABELS[m.method] ?? m.method,
                    m.amount,
                    `${m.percent}%`,
                  ]),
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {paymentMethodsError && (
              <p className="text-destructive">
                Failed to load: {getErrorMessage(paymentMethodsErrorDetail, 'Something went wrong.')}
              </p>
            )}
            {!paymentMethodsError && (!paymentMethods || paymentMethods.length === 0) && (
              <p className="text-muted-foreground">No payments in this range.</p>
            )}
            {paymentMethods?.map((m) => (
              <div key={m.method} className="flex items-center justify-between">
                <span>{PAYMENT_METHOD_LABELS[m.method] ?? m.method}</span>
                <span className="font-semibold">
                  ₹{Number(m.amount).toFixed(2)}{' '}
                  <span className="text-muted-foreground">({m.percent}%)</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Top Products</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!topProducts?.length}
            onClick={() =>
              downloadCsv(
                `top-products-${from}-to-${to}.csv`,
                ['Product', 'Quantity Sold', 'Revenue'],
                (topProducts ?? []).map((p) => [p.productName, p.quantity, p.revenue]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>Quantity Sold</TableHead>
                <TableHead className="pr-6">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProductsError && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-destructive">
                    Failed to load: {getErrorMessage(topProductsErrorDetail, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!topProductsError && (!topProducts || topProducts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No sales in this range.
                  </TableCell>
                </TableRow>
              )}
              {topProducts?.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="pl-6 font-medium">{p.productName}</TableCell>
                  <TableCell>{Number(p.quantity)}</TableCell>
                  <TableCell className="pr-6 font-semibold">
                    ₹{Number(p.revenue).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Low stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Low Stock</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!lowStock?.length}
            onClick={() =>
              downloadCsv(
                'low-stock.csv',
                ['Product', 'Stock', 'Reorder Level'],
                (lowStock ?? []).map((p) => [p.name, p.stockQty, p.reorderLevel]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="pr-6">Reorder Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockError && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-destructive">
                    Failed to load: {getErrorMessage(lowStockErrorDetail, 'Something went wrong.')}
                  </TableCell>
                </TableRow>
              )}
              {!lowStockError && (!lowStock || lowStock.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    All products are above their reorder level.
                  </TableCell>
                </TableRow>
              )}
              {lowStock?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                  <TableCell className="font-semibold text-amber-600">
                    {Number(p.stockQty)}
                  </TableCell>
                  <TableCell className="pr-6 text-muted-foreground">
                    {Number(p.reorderLevel)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
