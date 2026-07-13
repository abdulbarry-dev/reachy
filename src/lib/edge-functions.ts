export function getEdgeFunctionUrl(name: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '') ?? ''
  return `${base}/functions/v1/${name}`
}