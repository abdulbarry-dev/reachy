import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLandingScroll } from '../../src/pages/landing/useLandingScroll'

/**
 * Contract tests for the landing scroll choreography, exercised at the GSAP
 * seam. Visual behaviour is still verified in a real browser; these tests pin
 * the decisions that are easy to break silently:
 *
 * - a re-split must not replay a heading that already revealed (font swaps and
 *   resizes re-run `onSplit`, and replaying reads as a flash)
 * - a re-split before the reveal *must* rebuild the tween, so off-screen
 *   headings are not left stuck behind their mask
 * - curtain radius comes from each card's computed CSS, not a constant, so the
 *   mobile gauge keeps the radius DESIGN.md gives it
 */

const mocks = vi.hoisted(() => ({
  gsap: {
    matchMedia: vi.fn(),
    utils: { toArray: vi.fn() },
    set: vi.fn(),
    from: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
  },
  ScrollTrigger: { batch: vi.fn(), refresh: vi.fn() },
  SplitText: { create: vi.fn() },
  matchMediaRevert: vi.fn(),
  cancelRefresh: vi.fn(),
}))

vi.mock('../../src/lib/gsap', async () => {
  const { useLayoutEffect } = await import('react')
  return {
    gsap: mocks.gsap,
    ScrollTrigger: mocks.ScrollTrigger,
    SplitText: mocks.SplitText,
    useGSAP: (callback: () => void) => useLayoutEffect(callback, [callback]),
  }
})

vi.mock('../../src/lib/scroll', () => ({
  refreshAfterFonts: () => mocks.cancelRefresh,
}))

type SplitConfig = {
  onSplit: (split: { lines: HTMLElement[] }) => unknown
}

function MotionHarness({ root }: { root: HTMLElement | null }) {
  useLandingScroll({ current: root }, { current: null })
  return null
}

let root: HTMLDivElement
let heading: HTMLHeadingElement

function splitConfig(): SplitConfig {
  return mocks.SplitText.create.mock.calls[0][1] as SplitConfig
}

beforeEach(() => {
  vi.clearAllMocks()

  root = document.createElement('div')
  root.innerHTML = [
    '<section id="deliverability"><div class="gauge-card"></div></section>',
    '<div class="split-img-card"></div>',
  ].join('')
  heading = document.createElement('h2')
  root.append(heading)
  document.body.append(root)

  // Only the heading query returns a target: the reveal batches stay empty so
  // their `gsap.set` calls cannot pollute the assertions below.
  mocks.gsap.utils.toArray.mockImplementation((selector: string) =>
    selector === '.section-header h2' ? [heading] : [],
  )
  mocks.gsap.matchMedia.mockImplementation(() => ({
    add: (_conditions: unknown, callback: () => (() => void) | void) => callback(),
    revert: mocks.matchMediaRevert,
  }))
  mocks.gsap.from.mockReturnValue({ kill: vi.fn() })
  mocks.gsap.fromTo.mockReturnValue({})
  mocks.SplitText.create.mockReturnValue({ revert: vi.fn() })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('useLandingScroll heading masks', () => {
  it('settles a re-split instead of replaying a heading that already revealed', () => {
    render(<MotionHarness root={root} />)
    const config = splitConfig()
    const line = document.createElement('div')

    config.onSplit({ lines: [line] })
    expect(mocks.gsap.from).toHaveBeenCalledTimes(1)

    // The reveal actually played (its ScrollTrigger fired).
    const fromVars = mocks.gsap.from.mock.calls[0][1] as { onStart: () => void }
    fromVars.onStart()

    // The webfont lands and SplitText re-splits the heading.
    config.onSplit({ lines: [line] })

    expect(mocks.gsap.from).toHaveBeenCalledTimes(1)
    expect(mocks.gsap.set).toHaveBeenCalledWith([line], { yPercent: 0 })
  })

  it('rebuilds the tween when a re-split happens before the reveal played', () => {
    render(<MotionHarness root={root} />)
    const config = splitConfig()
    const line = document.createElement('div')

    config.onSplit({ lines: [line] })
    config.onSplit({ lines: [line] })

    expect(mocks.gsap.from).toHaveBeenCalledTimes(2)
    expect(mocks.gsap.set).not.toHaveBeenCalled()
  })
})

describe('useLandingScroll curtain radius', () => {
  it("opens each curtain at its own computed CSS radius", () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (element) =>
        ({
          borderRadius: element.classList.contains('gauge-card') ? '20px' : '32px',
        }) as CSSStyleDeclaration,
    )

    render(<MotionHarness root={root} />)

    const gaugeFrom = mocks.gsap.fromTo.mock.calls[0][1] as { clipPath: () => string }
    const gaugeTo = mocks.gsap.fromTo.mock.calls[0][2] as { clipPath: () => string }
    const splitTo = mocks.gsap.fromTo.mock.calls[1][2] as { clipPath: () => string }

    // 20px is `.gauge-card` below 768px; a hardcoded 2rem would render 32px.
    expect(gaugeFrom.clipPath()).toBe('inset(7% 6% round 20px)')
    expect(gaugeTo.clipPath()).toBe('inset(0% 0% round 20px)')
    expect(splitTo.clipPath()).toBe('inset(0% 0% round 32px)')
  })
})
