export interface AuthenticatedUser {
  userId: string
  businessId: string
  email: string
  name: string
  roleId: string
  roleName: string
  permissions: string[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthenticatedUser
}
