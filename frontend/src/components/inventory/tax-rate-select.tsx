import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TaxRate } from '@/types/tax-rate'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TaxRateSelectProps {
  value: number
  onChange: (percent: number) => void
  id?: string
}

/** Product tax-rate dropdown, populated from Settings → Tax Rates (seeded GST slabs + business-defined custom rates). */
export function TaxRateSelect({ value, onChange, id }: TaxRateSelectProps) {
  const { data: taxRates } = useQuery({
    queryKey: ['tax-rates'],
    queryFn: async () => (await api.get<TaxRate[]>('/tax-rates')).data,
  })

  const stringValue = String(value)

  // Base UI's <Select.Value> needs an explicit items map to show labels
  // instead of the raw value (see billing-page.tsx for the full story).
  const items = Object.fromEntries(
    (taxRates ?? []).map((t) => [String(Number(t.percent)), `${t.name} (${Number(t.percent)}%)`]),
  )
  // The product's saved rate might not match any preset (e.g. a one-off
  // value, or seeded before Tax Rates existed) — fall back to showing it
  // directly so it's never silently blank.
  if (!items[stringValue]) items[stringValue] = `${value}%`

  return (
    <Select
      items={items}
      value={stringValue}
      onValueChange={(v) => onChange(v ? Number(v) : 0)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {taxRates?.map((t) => (
          <SelectItem key={t.id} value={String(Number(t.percent))}>
            {t.name} ({Number(t.percent)}%)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
