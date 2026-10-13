import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Search, User, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import type { Customer } from '@/types/customer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface CustomerComboboxProps {
  value: Customer | null
  onChange: (customer: Customer | null) => void
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

export function CustomerCombobox({ value, onChange }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the search input manually once the popover has actually mounted,
  // instead of HTML `autoFocus` — stealing focus synchronously on mount can
  // race with the popover's own "focus moved" dismiss-on-outside-interaction
  // check and cause it to close itself immediately after opening.
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const { data: customers, isFetching } = useQuery({
    queryKey: ['customers', 'combobox', debouncedSearch],
    queryFn: async () => {
      const res = await api.get<Customer[]>('/customers', {
        params: debouncedSearch ? { search: debouncedSearch } : undefined,
      })
      return res.data.filter((c) => c.isActive)
    },
    enabled: open,
  })

  function select(customer: Customer | null) {
    onChange(customer)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {value ? (
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">
            {value ? value.name : 'Walk-in customer'}
          </span>
          {value?.phone && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {value.phone}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-2" align="start">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="h-8 pl-8 text-sm"
            placeholder="Search by name or last 4 digits of phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          <button
            type="button"
            onClick={() => select(null)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          >
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">Walk-in customer</span>
            <Check
              className={cn(
                'h-4 w-4 shrink-0',
                value === null ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>

          {isFetching && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              Searching...
            </div>
          )}
          {!isFetching && customers?.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No customers found.
            </div>
          )}
          {!isFetching &&
            customers?.map((customer) => (
              <button
                type="button"
                key={customer.id}
                onClick={() => select(customer)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{customer.name}</span>
                {customer.phone && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {customer.phone}
                  </span>
                )}
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value?.id === customer.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
