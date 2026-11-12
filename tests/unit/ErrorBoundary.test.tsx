import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../../src/components/ErrorBoundary'

afterEach(() => {
  vi.restoreAllMocks()
})

function CrashingChild({ error }: { error?: Error }) {
  if (error) {
    throw error
  }
  return <div>Normal Content</div>
}

describe('ErrorBoundary (Dev vs Production Error Handling)', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Normal Content')).toBeInTheDocument()
  })

  it('renders DevErrorView with actual error when in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    // Suppress console.error during expected React boundary trip
    vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      process.env.NODE_ENV = 'development'
      const crash = new Error('Raw developer failure message')
      crash.stack = 'Error: Raw developer failure message\n    at CrashingChild'

      render(
        <ErrorBoundary>
          <CrashingChild error={crash} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('DEVELOPMENT ERROR OVERLAY')).toBeInTheDocument()
      expect(screen.getByText('Raw developer failure message')).toBeInTheDocument()
      expect(screen.getAllByText(/at CrashingChild/).length).toBeGreaterThanOrEqual(1)
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it('renders sanitized ErrorView when in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      process.env.NODE_ENV = 'production'
      const crash = new Error('Sensitive SQL password leak')
      crash.stack = 'Error: Sensitive SQL\n    at SecretService'

      render(
        <ErrorBoundary>
          <CrashingChild error={crash} />
        </ErrorBoundary>,
      )

      expect(screen.queryByText('DEVELOPMENT ERROR OVERLAY')).toBeNull()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/The page hit an unexpected error/i)).toBeInTheDocument()
      expect(screen.queryByText('Sensitive SQL password leak')).toBeNull()
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it('allows toggling to production preview in development mode', async () => {
    const originalEnv = process.env.NODE_ENV
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    try {
      process.env.NODE_ENV = 'development'
      const crash = new Error('Dev test error for preview')

      render(
        <ErrorBoundary>
          <CrashingChild error={crash} />
        </ErrorBoundary>,
      )

      expect(screen.getByText('DEVELOPMENT ERROR OVERLAY')).toBeInTheDocument()

      const previewBtn = screen.getByRole('button', { name: /Preview Production Error Page/i })
      await user.click(previewBtn)

      // Switches to production ErrorView
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Switch back
      const toggleBackBtn = screen.getByRole('button', { name: /Switch to Dev Error Diagnostics/i })
      await user.click(toggleBackBtn)
      expect(screen.getByText('DEVELOPMENT ERROR OVERLAY')).toBeInTheDocument()
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})
