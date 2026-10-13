import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ListPlus, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type {
  FieldDefinition,
  FieldDefinitionPayload,
  FieldEntityType,
  FieldType,
} from '@/types/field-definition'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const ENTITY_TABS: { value: FieldEntityType; label: string }[] = [
  { value: 'product', label: 'Products' },
  { value: 'customer', label: 'Customers' },
  { value: 'supplier', label: 'Suppliers' },
]

const FIELD_TYPE_ITEMS: Record<FieldType, string> = {
  text: 'Text',
  number: 'Number',
  boolean: 'Yes / No',
  date: 'Date',
  select: 'Dropdown',
}

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function CustomFieldsCard() {
  const queryClient = useQueryClient()
  const [entityType, setEntityType] = useState<FieldEntityType>('product')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FieldDefinition | null>(null)

  const [label, setLabel] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('text')
  const [options, setOptions] = useState('')
  const [isRequired, setIsRequired] = useState(false)

  const {
    data: fields,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['field-definitions', entityType],
    queryFn: async () =>
      (
        await api.get<FieldDefinition[]>('/field-definitions', {
          params: { entityType },
        })
      ).data,
  })

  const createMutation = useMutation({
    mutationFn: (payload: FieldDefinitionPayload) => api.post('/field-definitions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-definitions'] })
      toast.success('Field added')
      closeDialog()
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to add field')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/field-definitions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-definitions'] })
      toast.success('Field removed')
      setDeleteTarget(null)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to remove field')),
  })

  function openCreate() {
    setLabel('')
    setFieldType('text')
    setOptions('')
    setIsRequired(false)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldKey = slugify(label)
    if (!fieldKey) {
      toast.error('Enter a label to derive a field key from')
      return
    }
    const optionList = options
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    if (fieldType === 'select' && optionList.length === 0) {
      toast.error('Add at least one option for a dropdown field')
      return
    }
    createMutation.mutate({
      entityType,
      fieldKey,
      label,
      fieldType,
      options: fieldType === 'select' ? optionList : undefined,
      isRequired,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <ListPlus className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Custom Fields</CardTitle>
          </div>
          <CardDescription>
            Add extra fields your business needs — they'll show up when
            creating or editing records.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add Field
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {ENTITY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setEntityType(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                entityType === tab.value
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-sm text-destructive">
            Failed to load custom fields: {getErrorMessage(error, 'Something went wrong.')}
          </p>
        )}
        {!isLoading && !isError && (!fields || fields.length === 0) && (
          <p className="text-sm text-muted-foreground">
            No custom fields for {entityType}s yet.
          </p>
        )}
        <div className="space-y-2">
          {fields?.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-destructive">*</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {FIELD_TYPE_ITEMS[field.fieldType]}
                  {field.options?.length ? ` · ${field.options.join(', ')}` : ''}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(field)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field — {entityType}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Field label</Label>
              <Input
                id="field-label"
                required
                placeholder="e.g. Size, Batch Number, Warranty Period"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              {label && (
                <p className="text-xs text-muted-foreground">
                  Key: <code>{slugify(label)}</code>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Field type</Label>
              <Select
                items={FIELD_TYPE_ITEMS}
                value={fieldType}
                onValueChange={(v) => setFieldType((v as FieldType) ?? 'text')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_ITEMS).map(([value, typeLabel]) => (
                    <SelectItem key={value} value={value}>
                      {typeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldType === 'select' && (
              <div className="space-y-2">
                <Label htmlFor="field-options">Options (comma-separated)</Label>
                <Input
                  id="field-options"
                  placeholder="e.g. S, M, L, XL"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                />
              </div>
            )}
            <label
              htmlFor="field-required"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <span className="text-sm font-medium text-foreground">Required</span>
              <Switch id="field-required" checked={isRequired} onCheckedChange={setIsRequired} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Add Field
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the field from the form. Values already saved on
              existing records are kept but will no longer be shown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
