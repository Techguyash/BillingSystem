export interface AuditLog {
  id: string
  userId: string | null
  userName: string | null
  action: string
  entityType: string
  entityId: string | null
  description: string | null
  createdAt: string
}
