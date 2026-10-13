import type { Role } from './role'

export interface TeamUser {
  id: string
  name: string
  email: string
  isActive: boolean
  role: Role
  createdAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  roleId: string
}

export interface UpdateUserPayload {
  name?: string
  roleId?: string
  isActive?: boolean
  password?: string
}
