import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Package, Search, Truck, User } from 'lucide-react'
import { api } from '@/lib/api'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { Supplier } from '@/types/supplier'
import type { Invoice } from '@/types/invoice'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SearchResults {
  products: Product[]
  customers: Customer[]
  suppliers: Supplier[]
  invoices: Invoice[]
}

/** Simple debounce so we don't hit the API on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 250)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: "/" or Ctrl/Cmd+K jumps straight to search from
  // anywhere in the app, as long as focus isn't already inside a text
  // field — a common accessibility/power-user convenience (GitHub, Slack,
  // Linear all use the same pattern).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      const isShortcut = (e.key === '/' && !isTyping) || ((e.metaKey || e.ctrlKey) && e.key === 'k')
      if (isShortcut) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { data, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () =>
      (await api.get<SearchResults>('/search', { params: { q: debouncedQuery } })).data,
    enabled: debouncedQuery.trim().length >= 2,
  })

  const hasAnyResults =
    !!data &&
    (data.products.length > 0 ||
      data.customers.length > 0 ||
      data.suppliers.length > 0 ||
      data.invoices.length > 0)

  function go(path: string, prefillSearch?: string) {
    setOpen(false)
    setQuery('')
    navigate(path, prefillSearch ? { state: { prefillSearch } } : undefined)
  }

  return (
    <Popover
      open={open && query.trim().length >= 2}
      onOpenChange={setOpen}
    >
      <PopoverTrigger
        render={<div className="relative w-full max-w-sm" />}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search products, customers, invoices..."
          className="pl-8 pr-12"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {!query && (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[--anchor-width] max-h-96 overflow-y-auto p-2"
        align="start"
      >
        {isFetching && (
          <div className="py-4 text-center text-xs text-muted-foreground">Searching...</div>
        )}
        {!isFetching && !hasAnyResults && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            No results for "{debouncedQuery}".
          </div>
        )}

        {!isFetching && data?.products && data.products.length > 0 && (
          <div className="mb-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Products
            </div>
            {data.products.map((p) => (
              <button
                key={p.id}
                onClick={() => go('/inventory', p.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.name}</span>
                {p.sku && <span className="shrink-0 text-xs text-muted-foreground">{p.sku}</span>}
              </button>
            ))}
          </div>
        )}

        {!isFetching && data?.customers && data.customers.length > 0 && (
          <div className="mb-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Customers
            </div>
            {data.customers.map((c) => (
              <button
                key={c.id}
                onClick={() => go('/customers', c.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.name}</span>
                {c.phone && <span className="shrink-0 text-xs text-muted-foreground">{c.phone}</span>}
              </button>
            ))}
          </div>
        )}

        {!isFetching && data?.suppliers && data.suppliers.length > 0 && (
          <div className="mb-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Suppliers
            </div>
            {data.suppliers.map((s) => (
              <button
                key={s.id}
                onClick={() => go('/suppliers', s.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{s.name}</span>
                {s.phone && <span className="shrink-0 text-xs text-muted-foreground">{s.phone}</span>}
              </button>
            ))}
          </div>
        )}

        {!isFetching && data?.invoices && data.invoices.length > 0 && (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Invoices
            </div>
            {data.invoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => go('/invoices')}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{inv.invoiceNumber}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  ₹{Number(inv.totalAmount).toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
