'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Whether `pathname` is inside `href`. Matches on whole segments, so
 * `/recipients` is active on `/recipients/42` but not on `/recipients-old`.
 */
function isPathActive(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) return true
  if (exact) return false
  return pathname.startsWith(href.endsWith('/') ? href : `${href}/`)
}

interface NavLinkProps {
  href: string
  /** Only highlight on an exact match, not on nested routes. */
  exact?: boolean
  className?: string
  onClick?: () => void
  children: ReactNode
}

/** A `next/link` that marks itself active (class + `aria-current`) for the current route. */
export function NavLink({ href, exact = false, className = '', onClick, children }: NavLinkProps) {
  const pathname = usePathname() ?? '/'
  const isActive = isPathActive(pathname, href, exact)

  return (
    <Link
      href={href}
      className={isActive ? `${className} active`.trim() : className}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

/**
 * Client-side redirect for guards that can only decide after hydration
 * (the Supabase session lives in browser storage). Always replaces, so the
 * guarded URL never lands in history.
 */
export function Redirect({ to }: { to: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(to)
  }, [router, to])

  return null
}
