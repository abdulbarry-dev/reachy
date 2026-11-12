import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroSection } from '../../src/views/landing/HeroSection'

/**
 * Hero contract:
 * - states the product promise on the first screen
 * - exposes the two hero actions (signup + playground anchor)
 * - shows the pipeline steps and the dispatcher mockup
 * - content becomes fully visible once the entrance settles
 * - renders without crashing when animations are reduced or unavailable
 */

function renderHero() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <HeroSection />
      <Routes>
        <Route path="/signup" element={<div>signup-page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

type MockMediaQuery = {
  matches: boolean
  media: string
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  addListener: (listener: () => void) => void
  removeListener: (listener: () => void) => void
  onchange: null
  dispatchEvent: () => boolean
}

/**
 * jsdom ships no matchMedia; GSAP matchMedia needs it. The stub maps queries
 * honestly: "reduce" resolves to `reduced`, "no-preference" to `!reduced`,
 * everything else (input-capability queries) to false.
 */
function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string): MockMediaQuery => {
      let matches: boolean
      if (query.includes('prefers-reduced-motion: reduce')) {
        matches = reduced
      } else if (query.includes('prefers-reduced-motion')) {
        matches = !reduced
      } else {
        matches = false
      }
      return {
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn().mockReturnValue(false),
      }
    })
  )
}

/** The entrance animates visibility, so assertions wait for it to finish. */
async function expectVisibleSoon(get: () => HTMLElement) {
  await waitFor(() => expect(get()).toBeVisible(), { timeout: 4000, interval: 60 })
}

beforeEach(() => {
  stubMatchMedia(false)
  // The decorative canvas must degrade gracefully where 2D contexts don't exist
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('HeroSection', () => {
  it('states the deliverability promise as the headline', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByRole('heading', { level: 1 }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/spam folder/i)
  })

  it('labels the hero as deliverability-first', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByText(/deliverability first/i))
  })

  it('renders the dispatcher mockup with its live log', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByText(/campaign dispatcher/i))
    expect(screen.getByText(/live dispatch status/i)).toBeInTheDocument()
  })

  it('keeps the vault guarantee visible', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByText(/zero plaintext storage/i))
  })

  it('offers the primary signup action', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByRole('button', { name: /start free campaign/i }))
  })

  it('navigates to signup when the primary action is used', async () => {
    const user = userEvent.setup()
    renderHero()
    await expectVisibleSoon(() => screen.getByRole('button', { name: /start free campaign/i }))
    await user.click(screen.getByRole('button', { name: /start free campaign/i }))
    expect(screen.getByText('signup-page')).toBeInTheDocument()
  })

  it('links the personalization playground as the secondary action', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByRole('link', { name: /try personalization tool/i }))
    expect(screen.getByRole('link', { name: /try personalization tool/i })).toHaveAttribute('href', '#playground')
  })

  it('shows the three pipeline steps', async () => {
    renderHero()
    await expectVisibleSoon(() => screen.getByText(/connect smtp/i))
    expect(screen.getByText(/personalize/i)).toBeInTheDocument()
    expect(screen.getByText(/schedule net/i)).toBeInTheDocument()
  })

  it('shows content immediately when reduced motion is requested', async () => {
    stubMatchMedia(true)
    renderHero()
    // No entrance runs, so visibility must be instant — no settling wait.
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    expect(screen.getByRole('button', { name: /start free campaign/i })).toBeVisible()
  })
})
