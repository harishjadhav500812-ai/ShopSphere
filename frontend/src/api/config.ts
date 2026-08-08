/** Base URL for backend API calls. Empty uses same-origin (Vite proxy in dev). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
