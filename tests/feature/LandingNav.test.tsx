import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LandingNav } from '../../src/pages/landing/LandingNav'

/**
 * Landing nav contract:
 * - exposes the four landing sections as in-page anchors
 * - marks the section you are currently reading (not just "some link is green")
 * - takes on its solid surface once content starts passing beneath it
 * - opens a labelled drawer on mobile, closes it with the close button or Escape
 * - swaps the auth actions for a dashboard link when a session exists
 * - locks page scroll while the drawer covers the page
 */

function stubMatchMedia(reduced = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce') ? reduced : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn().mockReturnValue(false),
    }))
  )
}

function renderNav(props: Partial<{ user: boolean; activeSection: string }> = {}) {
  const { user = false, activeSection = '' } = props
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingNav user={user} activeSection={activeSection} />
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/signup" element={<div>signup-page</div>} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function scrollTo(value: number) {
  Object.defineProperty(window, 'scrollY', { value, writable: true, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

beforeEach(() => {
  stubMatchMedia()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
})

describe('LandingNav', () => {
  it('anchors every landing section', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: /sections/i })
    expect(within(nav).getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features')
    expect(within(nav).getByRole('link', { name: 'How it Works' })).toHaveAttribute('href', '#workflow')
    expect(within(nav).getByRole('link', { name: 'Playground' })).toHaveAttribute('href', '#playground')
    expect(within(nav).getByRole('link', { name: 'Deliverability' })).toHaveAttribute('href', '#deliverability')
  })

  it('marks only the section currently in view', () => {
    renderNav({ activeSection: 'workflow' })
    expect(screen.getByRole('link', { name: 'How it Works' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Features' })).not.toHaveAttribute('aria-current')
  })

  it('takes on its solid surface once content passes under it', () => {
    const { container } = renderNav()
    const nav = container.querySelector('.lp-navbar')
    expect(nav).not.toHaveClass('is-scrolled')
    act(() => scrollTo(120))
    expect(nav).toHaveClass('is-scrolled')
  })

  it('keeps both auth actions reachable when signed out', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/signup')
  })

  it('replaces the auth actions with the dashboard link when signed in', () => {
    renderNav({ user: true })
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Log In' })).not.toBeInTheDocument()
  })

  it('opens the drawer with the same sections', async () => {
    const user = userEvent.setup()
    renderNav()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open menu/i }))

    const drawer = screen.getByRole('dialog', { name: /site menu/i })
    expect(within(drawer).getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features')
  })

  it('locks page scroll only while the drawer is open', async () => {
    const user = userEvent.setup()
    renderNav()

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(screen.getByRole('button', { name: /close menu/i }))
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('closes the drawer on Escape', async () => {
    const user = userEvent.setup()
    renderNav()

    await user.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog', { name: /site menu/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    // The drawer animates out, so it leaves the accessibility tree a frame later.
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /site menu/i })).not.toBeInTheDocument())
  })
})
