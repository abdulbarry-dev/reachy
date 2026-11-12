import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorView } from '../../src/components/ErrorView'
import NotFound from '../../src/app/not-found'
import RootError from '../../src/app/error'
import DashboardError from '../../src/app/(dashboard)/error'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Error Pages Suite — Acceptance & Security Verification', () => {
  const statusCodes = [
    { code: 401, badge: '401 / UNAUTHORIZED', title: 'Session Expired', primaryHref: '/login' },
    { code: 403, badge: '403 / FORBIDDEN', title: 'Access Restricted', primaryHref: '/dashboard' },
    { code: 404, badge: '404 / NOT FOUND', title: 'Page Not Found', primaryHref: '/dashboard' },
    { code: 419, badge: '419 / EXPIRED', title: 'Page Expired' },
    { code: 429, badge: '429 / RATE LIMITED', title: 'Rate Limit Exceeded' },
    { code: 500, badge: '500 / SERVER ERROR', title: 'Unexpected Application Error' },
    { code: 503, badge: '503 / MAINTENANCE', title: 'Service Temporarily Unavailable' },
  ] as const

  for (const { code, badge, title, primaryHref } of statusCodes) {
    it(`renders correct badge, title, and structure for HTTP ${code}`, () => {
      const { unmount } = render(<ErrorView statusCode={code} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(badge)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()

      if (primaryHref) {
        const link = screen.getByRole('link', { name: code === 401 ? /Log In/i : /Back to Dashboard/i })
        expect(link).toHaveAttribute('href', primaryHref)
      }

      unmount()
    })
  }

  it('guarantees zero stack trace, SQL query, or directory leak for unhandled 500 exceptions', () => {
    const dangerousError = new Error(
      'QUERY ERROR: SELECT * FROM vault.decrypted_secrets WHERE id = "sec_999"; at /var/app/reachy/db/pool.ts:88',
    )
    dangerousError.stack = 'Error: QUERY ERROR\n    at Pool.query (/var/app/reachy/db/pool.ts:88:14)'

    const { container } = render(
      <ErrorView statusCode={500} error={dangerousError} />,
    )

    const renderedHtml = container.innerHTML

    // Zero leak verification
    expect(renderedHtml).not.toContain('QUERY ERROR')
    expect(renderedHtml).not.toContain('vault.decrypted_secrets')
    expect(renderedHtml).not.toContain('sec_999')
    expect(renderedHtml).not.toContain('/var/app/reachy')
    expect(renderedHtml).not.toContain('pool.ts')

    // Clean user message rendered
    expect(screen.getByText(/An unexpected error occurred while processing your request/i)).toBeInTheDocument()
    expect(screen.getByText(/^ref_[a-f0-9]{16}$/)).toBeInTheDocument()
  })

  it('renders NotFound component correctly', () => {
    render(<NotFound />)
    expect(screen.getByText('404 / NOT FOUND')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('renders RootError component and handles retry', async () => {
    const resetFn = vi.fn()
    const user = userEvent.setup()

    render(
      <RootError
        error={Object.assign(new Error('Fatal UI crash'), { digest: 'next_digest_12345' })}
        reset={resetFn}
      />,
    )

    expect(screen.getByText('500 / SERVER ERROR')).toBeInTheDocument()
    expect(screen.getByText('next_digest_12345')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: 'Try Again' })
    await user.click(retryBtn)
    expect(resetFn).toHaveBeenCalledTimes(1)
  })

  it('renders DashboardError component inside dashboard layout container without full-page header', () => {
    const resetFn = vi.fn()
    render(
      <DashboardError
        error={new Error('Sub-segment crash')}
        reset={resetFn}
      />,
    )

    // Should not render the standalone header link
    expect(screen.queryByRole('link', { name: 'Reachy Home' })).not.toBeInTheDocument()
    expect(screen.getByText('500 / SERVER ERROR')).toBeInTheDocument()
  })
})
