import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Unit } from '@/types/unit'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UnitSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
}

/** Product unit-of-measure dropdown, populated from Settings → Units (seeded defaults + business-defined custom units). */
export function UnitSelect({ value, onChange, id }: UnitSelectProps) {
  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => (await api.get<Unit[]>('/units')).data,
  })

  // Base UI's <Select.Value> needs an explicit items map to show labels
  // instead of the raw value (see billing-page.tsx for the full story).
  const items = Object.fromEntries(
    (units ?? []).map((u) => [u.abbreviation, `${u.name} (${u.abbreviation})`]),
  )
  // The product's saved unit might not be in the list yet (e.g. seeded
  // before Units existed) — fall back to showing the raw value so it's
  // never silently blank.
  if (value && !items[value]) items[value] = value

  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v ?? 'pcs')}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units?.map((u) => (
          <SelectItem key={u.id} value={u.abbreviation}>
            {u.name} ({u.abbreviation})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
