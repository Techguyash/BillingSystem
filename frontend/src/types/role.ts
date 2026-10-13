export interface Role {
  id: string
  name: string
  permissions: string[]
  isSystem: boolean
}

export interface RolePayload {
  name: string
  permissions: string[]
}
