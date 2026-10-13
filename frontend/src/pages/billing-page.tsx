import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Minus,
  PauseCircle,
  Plus,
  Receipt as ReceiptIcon,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { CreateInvoicePayload, Invoice, PaymentMethod } from '@/types/invoice'
import type { Business } from '@/types/business'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ReceiptDialog } from '@/components/billing/receipt-dialog'
import { CustomerCombobox } from '@/components/billing/customer-combobox'

interface CartLine {
  product: Product
  quantity: number
}

interface HeldOrder {
  id: string
  label: string
  cart: CartLine[]
  customer: Customer | null
  heldAt: string
}

interface Summary {
  todaySales: number
  todayInvoiceCount: number
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'Credit (Due)' },
]

// Base UI's <Select.Value> only shows the raw selected `value` unless the
// Root is given an `items` value->label map (it does NOT read the matched
// SelectItem's children like Radix does) — without this every Select in the
// app would display the raw value (e.g. "credit") instead of its label
// (e.g. "Credit (Due)").
const PAYMENT_METHOD_ITEMS = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
)

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function BillingPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null)

  const {
    data: products,
    isError: productsError,
    error: productsErrorDetail,
  } = useQuery({
    queryKey: ['products', 'pos', search],
    queryFn: async () => {
      const res = await api.get<Product[]>('/products', {
        params: search ? { search } : undefined,
      })
      return res.data.filter((p) => p.isActive)
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => (await api.get<Summary>('/reports/summary')).data,
  })

  const { data: recentInvoices } = useQuery({
    queryKey: ['invoices', 'pos-recent'],
    queryFn: async () => (await api.get<Invoice[]>('/invoices')).data.slice(0, 6),
  })

  const { data: business } = useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })

  const createInvoice = useMutation({
    mutationFn: (payload: CreateInvoicePayload) =>
      api.post<Invoice>('/invoices', payload).then((r) => r.data),
    onSuccess: (invoice) => {
      toast.success(`Invoice ${invoice.invoiceNumber} created`)
      setReceiptInvoice(invoice)
      setCart([])
      setSelectedCustomer(null)
      setPaymentMethod('cash')
      setDiscount(0)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['reports', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to create invoice')),
  })

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.product.id !== productId))
      return
    }
    setCart((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)),
    )
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId))
  }

  const totals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of cart) {
      const price = Number(line.product.sellingPrice)
      const taxRate = Number(line.product.taxRatePercent)
      const lineSubtotal = price * line.quantity
      subtotal += lineSubtotal
      taxTotal += (lineSubtotal * taxRate) / 100
    }
    const total = Math.max(subtotal + taxTotal - discount, 0)
    return { subtotal, taxTotal, total }
  }, [cart, discount])

  function handleCheckout() {
    if (cart.length === 0) return
    createInvoice.mutate({
      customerId: selectedCustomer?.id,
      items: cart.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
      })),
      paymentMethod,
      discountTotal: discount || undefined,
      notes: notes || undefined,
    })
  }

  function holdOrder() {
    if (cart.length === 0) return
    const order: HeldOrder = {
      id: crypto.randomUUID(),
      label: `Sale #${heldOrders.length + 1}`,
      cart,
      customer: selectedCustomer,
      heldAt: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setHeldOrders((prev) => [...prev, order])
    setCart([])
    setSelectedCustomer(null)
    toast.info('Sale held. Resume it anytime before checkout.')
  }

  function resumeOrder(order: HeldOrder) {
    setCart(order.cart)
    setSelectedCustomer(order.customer)
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id))
  }

  function discardOrder(id: string) {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg brand-soft-bg brand-text">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Today's Sales
              </div>
              <div className="text-lg font-bold">
                ₹{(summary?.todaySales ?? 0).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <ReceiptIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Invoices Today
              </div>
              <div className="text-lg font-bold">
                {summary?.todayInvoiceCount ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Items in Cart
              </div>
              <div className="text-lg font-bold">
                {cart.reduce((sum, l) => sum + l.quantity, 0)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <PauseCircle className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Held Sales
              </div>
              <div className="text-lg font-bold">{heldOrders.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Product search / picker */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU..."
              className="h-11 pl-9 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {heldOrders.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-1.5 text-xs"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-violet-600" />
                  <span className="font-medium">{order.label}</span>
                  <span className="text-muted-foreground">
                    {order.cart.length} items · {order.heldAt}
                  </span>
                  <button
                    className="font-semibold brand-text hover:underline"
                    onClick={() => resumeOrder(order)}
                  >
                    Resume
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => discardOrder(order.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {products?.map((product) => {
              const stock = Number(product.stockQty)
              const reorder = Number(product.reorderLevel)
              const stockStatus =
                stock <= 0 ? 'out' : stock <= reorder ? 'low' : 'ok'
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={stockStatus === 'out'}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border-l-4 border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50',
                    stockStatus === 'ok' && 'border-l-emerald-400',
                    stockStatus === 'low' && 'border-l-amber-400',
                    stockStatus === 'out' && 'border-l-red-300',
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {product.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {product.sku || product.unit}
                  </span>
                  <div className="mt-1 flex w-full items-center justify-between">
                    <span className="text-sm font-bold brand-text">
                      ₹{Number(product.sellingPrice).toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        stockStatus === 'ok' && 'text-muted-foreground',
                        stockStatus === 'low' && 'text-amber-600',
                        stockStatus === 'out' && 'text-red-500',
                      )}
                    >
                      {stockStatus === 'out'
                        ? 'Out of stock'
                        : `${stock} in stock`}
                    </span>
                  </div>
                </button>
              )
            })}
            {productsError && (
              <p className="col-span-full py-10 text-center text-sm text-destructive">
                Failed to load products: {getErrorMessage(productsErrorDetail, 'Something went wrong.')}
              </p>
            )}
            {!productsError && products?.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No products found.
              </p>
            )}
          </div>

          {/* Recent sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">Recent Sales</CardTitle>
              <button
                onClick={() => navigate('/invoices')}
                className="text-xs font-semibold brand-text hover:underline"
              >
                View all →
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(!recentInvoices || recentInvoices.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No sales yet today.
                </p>
              )}
              {recentInvoices?.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setReceiptInvoice(inv)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="brand-soft-bg brand-text text-[10px] font-bold">
                        {initialsOf(inv.customer?.name ?? 'Walk-in')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {inv.customer?.name ?? 'Walk-in customer'}
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold">
                    ₹{Number(inv.totalAmount).toFixed(2)}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <Card className="flex h-fit flex-col lg:sticky lg:top-0">
          <CardHeader>
            <CardTitle className="text-base">Current Sale</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Customer
              </label>
              <CustomerCombobox
                value={selectedCustomer}
                onChange={setSelectedCustomer}
              />
            </div>

            <Separator />

            <div className="max-h-72 flex-1 space-y-3 overflow-y-auto">
              {cart.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Cart is empty. Tap a product to add it.
                </p>
              )}
              {cart.map((line) => (
                <div key={line.product.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {line.product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ₹{Number(line.product.sellingPrice).toFixed(2)} each
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(line.product.id, line.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {line.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(line.product.id, line.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold">
                    ₹{(Number(line.product.sellingPrice) * line.quantity).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeLine(line.product.id)}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Discount (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Payment method
                </label>
                <Select
                  items={PAYMENT_METHOD_ITEMS}
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod((v as PaymentMethod) ?? 'cash')
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Notes (optional)
              </label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. delivery instructions, special request..."
              />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>₹{totals.taxTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={cart.length === 0}
                onClick={holdOrder}
              >
                <PauseCircle className="h-4 w-4" /> Hold
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={cart.length === 0 || createInvoice.isPending}
                onClick={handleCheckout}
              >
                {createInvoice.isPending
                  ? 'Processing...'
                  : `Charge ₹${totals.total.toFixed(2)}`}
              </Button>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setCart([])}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear cart
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiptDialog
        invoice={receiptInvoice}
        business={business}
        onClose={() => setReceiptInvoice(null)}
      />
    </div>
  )
}
