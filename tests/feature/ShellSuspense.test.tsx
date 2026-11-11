import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Layout } from '../../src/components/Layout'
import { ToastProvider } from '../../src/components/ToastProvider'
import { store } from '../../src/store'
import { setUser } from '../../src/store/authSlice'

/** A page chunk that never resolves: the worst case for a lazy navigation. */
const NeverReady = lazy(() => new Promise<{ default: () => null }>(() => {}))

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1440 })
  store.dispatch(
    setUser({ id: 'u1', email: 'user@example.com' } as Parameters<typeof setUser>[0]),
  )
})

describe('app shell while a page chunk loads', () => {  it('keeps the sidebar and swaps only the outlet', () => {
    render(
      <Provider store={store}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/recipients']}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="recipients" element={<NeverReady />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </Provider>,
    )

    // The shell is already interactive while the chunk is still in flight.
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Recipients/ })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading page' })).toBeInTheDocument()
  })

  it('recovers from a crashed page by navigating away', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()

    function Crashing(): never {
      throw new Error('page exploded')
    }

    render(
      <Provider store={store}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Crashing />} />
                <Route path="recipients" element={<p>recipients ok</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </Provider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')

    await user.click(screen.getByRole('link', { name: /Recipients/ }))

    expect(screen.getByText('recipients ok')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
