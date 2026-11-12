/**
 * The product logo mark. Shared by the landing navbar and the landing footer so
 * the wordmark renders identically everywhere.
 */
export function LogoSvg({ className }: { className?: string }) {
  return <img src="/logo.svg" alt="Reachy" className={className ?? 'lp-logo-svg'} />
}
