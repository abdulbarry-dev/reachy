import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../../src/components/ErrorBoundary'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('shows a recoverable fallback instead of unmounting the shell', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    let shouldThrow = true

    function Flaky() {
      if (shouldThrow) throw new Error('boom')
      return <p>recovered</p>
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('recovered')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers a reload when a lazy chunk fails to download', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReload = vi.fn()
    const user = userEvent.setup()

    function ChunkFailure(): never {
      throw new Error('Failed to fetch dynamically imported module: /assets/Recipients.js')
    }

    render(
      <ErrorBoundary onReload={onReload}>
        <ChunkFailure />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: 'Reload page' }))
    expect(onReload).toHaveBeenCalledTimes(1)
  })
})
