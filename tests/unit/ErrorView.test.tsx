import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorView } from '../../src/components/ErrorView'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorView Component', () => {
  it('renders 404 Not Found state with brand tokens and safe CTAs', () => {
    render(<ErrorView statusCode={404} />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText(/404 \/ NOT FOUND/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument()
    expect(screen.getByText(/The page or campaign you requested could not be found/i)).toBeInTheDocument()

    const dashboardLink = screen.getByRole('link', { name: /Back to Dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')

    const homeLink = screen.getByRole('link', { name: /Return Home/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders 500 Internal Server Error with zero stack leak and copyable reference ID', async () => {
    const rawError = new Error('FATAL: password authentication failed for user "reachy_admin"')
    rawError.stack = 'Error: FATAL: password authentication failed\n at Client.connect (/var/www/reachy/db.ts:12:3)'

    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')

    render(
      <ErrorView
        statusCode={500}
        error={rawError}
        referenceId="ref_deadbeefcafebabe"
      />,
    )

    // Heading & generic message
    expect(screen.getByRole('heading', { name: /Unexpected Application Error/i })).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred while processing your request/i)).toBeInTheDocument()

    // STRICT ZERO-LEAK ASSERTIONS: No passwords, user credentials, or file paths
    expect(screen.queryByText(/password authentication failed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/reachy_admin/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\/var\/www\/reachy/i)).not.toBeInTheDocument()

    // Reference ID badge displayed
    expect(screen.getByText(/ref_deadbeefcafebabe/i)).toBeInTheDocument()

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /Copy reference ID/i })
    await user.click(copyButton)

    expect(writeTextSpy).toHaveBeenCalledWith('ref_deadbeefcafebabe')
    expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
  })

  it('invokes onReset callback when Primary CTA is clicked on a retryable error', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()

    render(
      <ErrorView
        statusCode={500}
        onReset={onReset}
      />,
    )

    const retryButton = screen.getByRole('button', { name: /Try Again/i })
    await user.click(retryButton)

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders operational message if marked operational', () => {
    const opError = {
      isOperational: true,
      statusCode: 429,
      message: 'Custom operational rate-limit message: 20 seconds remaining.',
    }

    render(
      <ErrorView
        statusCode={429}
        error={opError}
      />,
    )

    expect(screen.getByRole('heading', { name: /Rate Limit Exceeded/i })).toBeInTheDocument()
    expect(screen.getByText(/Custom operational rate-limit message: 20 seconds remaining/i)).toBeInTheDocument()
  })
})
