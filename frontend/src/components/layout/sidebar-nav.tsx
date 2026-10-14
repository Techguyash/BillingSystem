import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  FileText,
  Truck,
  ShoppingCart,
  BarChart3,
  Settings,
  UserCog,
  Wallet,
  ClipboardList,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import type { Business } from '@/types/business'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  /** Key into business.settings.enabledModules — omit for items that are always shown. */
  moduleKey?: string
  /** Permission required to see this item — omit for items anyone can see. */
  permission?: string
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/billing', label: 'Billing / POS', icon: Receipt, moduleKey: 'billing' },
      { to: '/quotations', label: 'Quotations', icon: ClipboardList, permission: 'quotation.view' },
      { to: '/invoices', label: 'Invoices', icon: FileText, moduleKey: 'invoices' },
      { to: '/inventory', label: 'Inventory', icon: Package, moduleKey: 'inventory' },
      { to: '/purchases', label: 'Purchases', icon: ShoppingCart, moduleKey: 'purchases' },
      { to: '/customers', label: 'Customers', icon: Users, moduleKey: 'customers' },
      { to: '/suppliers', label: 'Suppliers', icon: Truck, moduleKey: 'suppliers' },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        to: '/reports',
        label: 'Reports',
        icon: BarChart3,
        moduleKey: 'reports',
        permission: 'reports.view',
      },
      { to: '/expenses', label: 'Expenses', icon: Wallet, permission: 'expense.manage' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/team', label: 'Team', icon: UserCog, permission: 'user.manage' },
      { to: '/audit-log', label: 'Audit Log', icon: History, permission: 'audit_log.view' },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function SidebarNav() {
  const { hasPermission } = useAuth()

  const { data: business } = useQuery({
    queryKey: ['business', 'me'],
    queryFn: async () => (await api.get<Business>('/business/me')).data,
  })

  // Undefined enabledModules (not configured yet) means "everything on" —
  // don't hide the whole app before settings have been touched once.
  const enabledModules = business?.settings.enabledModules

  function isVisible(item: NavItem) {
    if (item.permission && !hasPermission(item.permission)) return false
    if (item.moduleKey && enabledModules && !enabledModules.includes(item.moduleKey)) {
      return false
    }
    return true
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground shadow-sm">
          B
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Billing System
        </span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isVisible)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label}>
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity',
                            isActive ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <Icon className="h-4 w-4" />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Single-location plan</span>
          <br />
          All core modules enabled.
        </div>
      </div>
    </aside>
  )
}
