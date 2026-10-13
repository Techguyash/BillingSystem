import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Receipt, ShieldCheck, Package, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { getErrorMessage } from '@/lib/errors'

/**
 * Without this, any failure (wrong password, server down, CORS
 * misconfiguration, network drop) all rendered as "Invalid username or
 * password", which is actively misleading when the problem isn't the
 * credentials at all — e.g. a CORS rejection surfaces here as a network
 * error with no `response`, not a 401.
 */
function getLoginErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 401) {
    return 'Invalid username or password.'
  }
  return getErrorMessage(err, 'Something went wrong while signing in. Please try again.')
}

const HIGHLIGHTS = [
  {
    icon: Receipt,
    title: 'GST-ready billing',
    description: 'Create compliant invoices in seconds, at the counter.',
  },
  {
    icon: Package,
    title: 'Live inventory tracking',
    description: 'Stock levels update automatically with every sale.',
  },
  {
    icon: BarChart3,
    title: 'Reports that matter',
    description: 'Sales, GST, and profit insights without the spreadsheets.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Give every teammate exactly the access they need.',
  },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 35%)',
          }}
        />
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg font-bold backdrop-blur">
            B
          </div>
          <span className="text-lg font-semibold">Billing System</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl font-semibold leading-tight">
              Run your whole business from one screen.
            </h1>
            <p className="mt-3 max-w-md text-sm text-primary-foreground/80">
              Billing, inventory, customers, and reports — built for small
              shops and large operations alike.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5" />
                <div className="mt-2 text-sm font-medium">{title}</div>
                <div className="mt-1 text-xs text-primary-foreground/70">
                  {description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Billing System. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
              B
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your business account to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
