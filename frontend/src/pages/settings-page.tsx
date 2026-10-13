import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Check, LayoutGrid, Palette, Receipt } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useTheme, THEMES } from '@/context/theme-context'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import {
  AVAILABLE_MODULES,
  type Business,
  type UpdateBusinessPayload,
} from '@/types/business'
import { CustomFieldsCard } from '@/components/settings/custom-fields-card'

export function SettingsPage() {
  const { themeId, setThemeId } = useTheme()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Choose the accent color used across the dashboard, charts, and
            buttons. This applies for everyone using this install.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {THEMES.map((theme) => {
              const isActive = theme.id === themeId
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setThemeId(theme.id)}
                  className="group flex flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      'relative flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-all',
                      isActive
                        ? 'ring-foreground'
                        : 'ring-transparent group-hover:ring-border',
                    )}
                    style={{ background: theme.swatch }}
                  >
                    {isActive && (
                      <Check className="h-5 w-5 text-white drop-shadow" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {theme.label}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <BusinessProfileCard />
      <ModulesCard />
      <InvoiceCustomizationCard />
      <CustomFieldsCard />
    </div>
  )
}

function useBusiness() {
  return useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })
}

/** Drop empty-string fields so "cleared" optional inputs are omitted rather
 * than sent as `""`, which would fail format validators like @IsEmail(). */
function omitEmptyStrings(
  payload: UpdateBusinessPayload,
): UpdateBusinessPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== ''),
  ) as UpdateBusinessPayload
}

function useUpdateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBusinessPayload) =>
      api
        .patch<Business>('/business/me', omitEmptyStrings(payload))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] })
      toast.success('Saved')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, 'Failed to save')),
  })
}

function BusinessProfileCard() {
  const { data: business, isLoading } = useBusiness()
  const updateBusiness = useUpdateBusiness()

  const [form, setForm] = useState<UpdateBusinessPayload>({})

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        gstin: business.gstin ?? '',
        email: business.email ?? '',
        phone: business.phone ?? '',
        address: business.address ?? '',
        state: business.state ?? '',
      })
    }
  }, [business])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateBusiness.mutate(form)
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Business Profile</CardTitle>
        </div>
        <CardDescription>
          Shown on invoices/receipts. The state field determines whether tax
          is split as CGST+SGST (same state as customer) or IGST (different
          state).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business name</Label>
            <Input
              id="biz-name"
              value={form.name ?? ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz-gstin">GSTIN</Label>
              <Input
                id="biz-gstin"
                value={form.gstin ?? ''}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-state">State</Label>
              <Input
                id="biz-state"
                placeholder="e.g. Karnataka"
                value={form.state ?? ''}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz-email">Email</Label>
              <Input
                id="biz-email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-phone">Phone</Label>
              <Input
                id="biz-phone"
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-address">Address</Label>
            <Textarea
              id="biz-address"
              rows={2}
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={updateBusiness.isPending}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ModulesCard() {
  const { data: business, isLoading } = useBusiness()
  const updateBusiness = useUpdateBusiness()
  const [enabled, setEnabled] = useState<string[]>([])

  useEffect(() => {
    if (business) {
      setEnabled(business.settings.enabledModules ?? AVAILABLE_MODULES.map((m) => m.key))
    }
  }, [business])

  function toggle(key: string, checked: boolean) {
    const next = checked ? [...enabled, key] : enabled.filter((k) => k !== key)
    setEnabled(next)
    updateBusiness.mutate({ enabledModules: next })
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Modules</CardTitle>
        </div>
        <CardDescription>
          Hide sections your business doesn't use. Dashboard and Settings are
          always available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AVAILABLE_MODULES.map((m) => (
            <label
              key={m.key}
              htmlFor={`module-${m.key}`}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
            >
              <span className="text-sm font-medium text-foreground">{m.label}</span>
              <Switch
                id={`module-${m.key}`}
                checked={enabled.includes(m.key)}
                onCheckedChange={(checked) => toggle(m.key, checked)}
              />
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function InvoiceCustomizationCard() {
  const { data: business, isLoading } = useBusiness()
  const updateBusiness = useUpdateBusiness()

  const [form, setForm] = useState<UpdateBusinessPayload>({})

  useEffect(() => {
    if (business) {
      setForm({
        logoUrl: business.settings.logoUrl ?? '',
        invoiceTerms: business.settings.invoiceTerms ?? '',
        invoiceFooter: business.settings.invoiceFooter ?? '',
        invoiceNumberPrefix: business.settings.invoiceNumberPrefix ?? 'INV',
        showHsnCodeOnInvoice: business.settings.showHsnCodeOnInvoice ?? false,
      })
    }
  }, [business])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateBusiness.mutate(form)
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <CardTitle>Invoice Customization</CardTitle>
        </div>
        <CardDescription>
          Appears on printed receipts and invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                placeholder="https://..."
                value={form.logoUrl ?? ''}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">Invoice number prefix</Label>
              <Input
                id="invoice-prefix"
                placeholder="INV"
                value={form.invoiceNumberPrefix ?? ''}
                onChange={(e) =>
                  setForm({ ...form, invoiceNumberPrefix: e.target.value })
                }
              />
            </div>
          </div>
          <label
            htmlFor="show-hsn"
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
          >
            <div>
              <div className="text-sm font-medium text-foreground">
                Show HSN code on receipts
              </div>
              <div className="text-xs text-muted-foreground">
                Adds an HSN code column to the printed item table.
              </div>
            </div>
            <Switch
              id="show-hsn"
              checked={form.showHsnCodeOnInvoice ?? false}
              onCheckedChange={(checked) =>
                setForm({ ...form, showHsnCodeOnInvoice: checked })
              }
            />
          </label>
          <div className="space-y-2">
            <Label htmlFor="invoice-terms">Terms &amp; conditions</Label>
            <Textarea
              id="invoice-terms"
              rows={2}
              placeholder="E.g. Goods once sold will not be taken back."
              value={form.invoiceTerms ?? ''}
              onChange={(e) =>
                setForm({ ...form, invoiceTerms: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-footer">Footer note</Label>
            <Input
              id="invoice-footer"
              placeholder="E.g. Thank you for your business!"
              value={form.invoiceFooter ?? ''}
              onChange={(e) =>
                setForm({ ...form, invoiceFooter: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={updateBusiness.isPending}>
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
