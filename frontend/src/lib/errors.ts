import axios from 'axios'

/**
 * Extracts a human-readable message from an API error for toast/alert
 * display. Without this, every failed mutation either showed a generic
 * "Failed to X" (losing the backend's actual validation/business-logic
 * message, e.g. "costPrice must not be less than 0") or nothing useful at
 * all for network/CORS failures. Centralized so every page behaves the same
 * way instead of each form inventing its own (inconsistent) handling.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Could not reach the server. Check your connection and try again.'
    }
    const message = err.response.data?.message
    if (message) {
      return Array.isArray(message) ? message.join(', ') : String(message)
    }
  }
  return fallback
}
