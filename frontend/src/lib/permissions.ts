/** Friendly labels/grouping for the raw permission strings the backend returns. */
export const PERMISSION_GROUPS: { label: string; permissions: { key: string; label: string }[] }[] = [
  {
    label: 'Billing',
    permissions: [
      { key: 'invoice.create', label: 'Create invoices' },
      { key: 'invoice.void', label: 'Void invoices' },
      { key: 'invoice.view', label: 'View invoices' },
    ],
  },
  {
    label: 'Inventory',
    permissions: [
      { key: 'inventory.view', label: 'View inventory' },
      { key: 'inventory.adjust_stock', label: 'Adjust stock & record purchases' },
      { key: 'product.manage', label: 'Manage products' },
    ],
  },
  {
    label: 'Contacts',
    permissions: [
      { key: 'customer.manage', label: 'Manage customers' },
      { key: 'supplier.manage', label: 'Manage suppliers' },
    ],
  },
  {
    label: 'Reports',
    permissions: [
      { key: 'reports.view', label: 'View reports' },
      { key: 'reports.view_gst', label: 'View GST reports' },
    ],
  },
  {
    label: 'Administration',
    permissions: [
      { key: 'settings.manage', label: 'Manage settings' },
      { key: 'user.manage', label: 'Manage users' },
      { key: 'role.manage', label: 'Manage roles' },
    ],
  },
]

export const PERMISSION_LABELS: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label])),
)
