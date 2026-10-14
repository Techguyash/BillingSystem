import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, tokenStorage } from '@/lib/api'
import type { AuthenticatedUser, LoginResponse } from '@/types/auth'

interface UpdateProfilePayload {
  name?: string
  currentPassword?: string
  newPassword?: string
}

interface AuthContextValue {
  user: AuthenticatedUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    api
      .get<AuthenticatedUser>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    })
    tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken)
    setUser(res.data.user)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const res = await api.patch<LoginResponse>('/auth/me', payload)
    tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken)
    setUser(res.data.user)
  }, [])

  const hasPermission = useCallback(
    (permission: string) => !!user?.permissions.includes(permission),
    [user],
  )

  const value = useMemo(
    () => ({ user, isLoading, login, logout, hasPermission, updateProfile }),
    [user, isLoading, login, logout, hasPermission, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
