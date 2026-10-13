export interface ThemeDefinition {
  id: string
  label: string
  swatch: string
}

export const THEMES: ThemeDefinition[] = [
  { id: 'emerald', label: 'Emerald', swatch: 'linear-gradient(135deg,#064e3b,#10b981)' },
  { id: 'indigo', label: 'Indigo', swatch: 'linear-gradient(135deg,#1e1b4b,#6366f1)' },
  { id: 'teal-cyan', label: 'Teal / Cyan', swatch: 'linear-gradient(135deg,#083344,#22d3ee)' },
  { id: 'navy-gold', label: 'Navy / Gold', swatch: 'linear-gradient(135deg,#0f172a,#d97706)' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg,#7c2d12,#fb923c)' },
  { id: 'royal-purple', label: 'Royal Purple', swatch: 'linear-gradient(135deg,#2e1065,#c084fc)' },
  { id: 'forest', label: 'Forest', swatch: 'linear-gradient(135deg,#052e16,#4ade80)' },
  { id: 'cobalt', label: 'Cobalt', swatch: 'linear-gradient(135deg,#0b1f52,#60a5fa)' },
  { id: 'crimson', label: 'Crimson', swatch: 'linear-gradient(135deg,#4c0519,#fb7185)' },
]

export const DEFAULT_THEME_ID = 'emerald'

export function isValidThemeId(id: string | null): id is string {
  return !!id && THEMES.some((t) => t.id === id)
}
