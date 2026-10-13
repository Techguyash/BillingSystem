import { type LucideIcon, Construction } from 'lucide-react'

export function PlaceholderPage({
  title,
  icon: Icon = Construction,
}: {
  title: string
  icon?: LucideIcon
}) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {title} is coming up next
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          This module is scheduled for the next implementation phase. The
          navigation and layout are already wired up so it drops in cleanly.
        </p>
      </div>
    </div>
  )
}
