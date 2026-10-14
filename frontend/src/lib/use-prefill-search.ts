import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Picks up a `prefillSearch` value passed via router state (set by
 * GlobalSearch when you click a result) and seeds a page's own search box
 * with it, once. Clears the location state afterward so navigating back
 * doesn't re-apply it unexpectedly.
 */
export function usePrefillSearch(): [string, (value: string) => void] {
  const location = useLocation()
  const navigate = useNavigate()
  const prefill = (location.state as { prefillSearch?: string } | null)?.prefillSearch

  const [search, setSearch] = useState(prefill ?? '')

  useEffect(() => {
    if (!prefill) return
    setSearch(prefill)
    // Clear it from history state so a later back/forward navigation to
    // this same route doesn't silently re-seed the search box.
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  return [search, setSearch]
}
