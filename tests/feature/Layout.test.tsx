import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Layout } from '../../src/components/Layout'
import { ToastProvider } from '../../src/components/ToastProvider'
import { store } from '../../src/store'
import { setUser } from '../../src/store/authSlice'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

function resizeTo(width: number) {
  act(() => {
    setViewportWidth(width)
    window.dispatchEvent(new Event('resize'))
  })
}

function renderLayout() {
  return render(
    <Provider store={store}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<Layout><Outlet /></Layout>}>
              <Route path="dashboard" element={<p>page content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </Provider>,
  )
}

const overlay = (container: HTMLElement) => container.querySelector('.sidebar-overlay')

beforeEach(() => {
  store.dispatch(
    setUser({ id: 'u1', email: 'user@example.com' } as Parameters<typeof setUser>[0]),
  )
})

describe('Layout responsive shell', () => {
  it('shows the mobile topbar only below the breakpoint', () => {
    setViewportWidth(390)
    renderLayout()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()

    resizeTo(1440)
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument()
  })

  it('closes the mobile drawer when the viewport grows and keeps it closed', () => {
    setViewportWidth(390)
    const { container } = renderLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(overlay(container)).not.toBeNull()

    resizeTo(1440)
    expect(overlay(container)).toBeNull()

    // Returning to a narrow viewport must not resurrect the drawer.
    resizeTo(390)
    expect(overlay(container)).toBeNull()
  })
})
