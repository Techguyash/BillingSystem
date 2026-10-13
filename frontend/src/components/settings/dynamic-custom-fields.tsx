import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FieldDefinition, FieldEntityType } from '@/types/field-definition'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface DynamicCustomFieldsProps {
  entityType: FieldEntityType
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
}

/** Renders business-defined extra fields (Settings → Custom Fields) inline in a form. */
export function DynamicCustomFields({ entityType, values, onChange }: DynamicCustomFieldsProps) {
  const { data: fields } = useQuery({
    queryKey: ['field-definitions', entityType],
    queryFn: async () =>
      (
        await api.get<FieldDefinition[]>('/field-definitions', {
          params: { entityType },
        })
      ).data,
  })

  if (!fields || fields.length === 0) return null

  function setValue(key: string, value: unknown) {
    onChange({ ...values, [key]: value })
  }

  return (
    <>
      <Separator />
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Additional Details
        </p>
        {fields.map((field) => {
          const value = values[field.fieldKey]
          const id = `custom-${field.fieldKey}`

          if (field.fieldType === 'boolean') {
            return (
              <label
                key={field.id}
                htmlFor={id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <span className="text-sm font-medium text-foreground">
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-destructive">*</span>}
                </span>
                <Switch
                  id={id}
                  checked={Boolean(value)}
                  onCheckedChange={(checked) => setValue(field.fieldKey, checked)}
                />
              </label>
            )
          }

          if (field.fieldType === 'select') {
            const itemsMap = Object.fromEntries((field.options ?? []).map((o) => [o, o]))
            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={id}>
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-destructive">*</span>}
                </Label>
                <Select
                  items={itemsMap}
                  value={typeof value === 'string' ? value : ''}
                  onValueChange={(v) => setValue(field.fieldKey, v ?? '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }

          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={id}>
                {field.label}
                {field.isRequired && <span className="ml-1 text-destructive">*</span>}
              </Label>
              <Input
                id={id}
                type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                required={field.isRequired}
                value={value == null ? '' : String(value)}
                onChange={(e) =>
                  setValue(
                    field.fieldKey,
                    field.fieldType === 'number' ? Number(e.target.value) : e.target.value,
                  )
                }
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
