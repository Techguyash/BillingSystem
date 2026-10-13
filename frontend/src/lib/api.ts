import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
})

const ACCESS_TOKEN_KEY = 'billing.accessToken'
const REFRESH_TOKEN_KEY = 'billing.refreshToken'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

// A 401 from these endpoints means "bad credentials" / "bad refresh token",
// not "your session expired" — without this exclusion, a wrong password on
// the login form itself triggered this interceptor's redirect-to-/login
// logic, hard-reloading the page and wiping the just-set error message
// before React ever had a chance to render it.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh']

function isAuthEndpoint(url: string | undefined): boolean {
  return !!url && AUTH_ENDPOINTS.some((path) => url.includes(path))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest?.url)
    ) {
      originalRequest._retry = true
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        refreshPromise ??= api
          .post('/auth/refresh', { refreshToken })
          .then((res) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data
            tokenStorage.setTokens(accessToken, newRefreshToken)
            return accessToken
          })
          .finally(() => {
            refreshPromise = null
          })

        const newAccessToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)
