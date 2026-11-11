import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLandingScroll } from '../../src/pages/landing/useLandingScroll'

/**
 * Contract tests for the landing scroll choreography, exercised at the GSAP
 * seam. Visual behaviour is still verified in a real browser; these tests pin
 * the decisions that are easy to break silently:
 *
 * - reduced motion must write no styles at all (that is how "just render the
 *   end state" is guaranteed, not by a second code path)
 * - reveals batch per group, with the trust strip on its own shallower line
 * - every heading reveals exactly once, even across font-driven re-splits
 * - curtain radius comes from the card's computed CSS, not a constant
 * - unmount reverts the media context, the splits, and the font refresh
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
  type: string
  mask: string
  autoSplit: boolean
  onSplit: (split: { lines: HTMLElement[] }) => unknown
}

type BatchVars = {
  start: string
  once: boolean
  onEnter: (batch: HTMLElement[]) => void
}

let root: HTMLDivElement
let heading: HTMLHeadingElement
let card: HTMLDivElement
let gauge: HTMLElement
let splitCard: HTMLElement
let progress: HTMLDivElement
/** Cleanups returned from matchMedia.add callbacks, as GSAP would run them. */
let mediaCleanups: Array<() => void>

function MotionHarness({
  rootElement,
  progressElement = null,
}: {
  rootElement: HTMLElement | null
  progressElement?: HTMLElement | null
}) {
  useLandingScroll({ current: rootElement }, { current: progressElement })
  return null
}

function splitConfig(): SplitConfig {
  return mocks.SplitText.create.mock.calls[0][1] as SplitConfig
}

beforeEach(() => {
  vi.clearAllMocks()
  mediaCleanups = []

  root = document.createElement('div')
  root.innerHTML = [
    '<section id="deliverability"><div class="gauge-card" data-motion="curtain"></div></section>',
    '<div class="split-img-card" data-motion="curtain"></div>',
  ].join('')
  heading = document.createElement('h2')
  card = document.createElement('div')
  progress = document.createElement('div')
  root.append(heading, card)
  document.body.append(root)
  gauge = root.querySelector('.gauge-card') as HTMLElement
  splitCard = root.querySelector('.split-img-card') as HTMLElement

  // The hook resolves targets by the data-motion contract, never by section
  // markup, so the harness only has to answer those queries.
  mocks.gsap.utils.toArray.mockImplementation((selector: string) => {
    if (selector === '[data-motion="heading"]') return [heading]
    if (selector === '[data-motion="curtain"]') return [gauge, splitCard]
    return [card]
  })
  mocks.gsap.matchMedia.mockImplementation(() => ({
    add: (_conditions: unknown, callback: () => (() => void) | void) => {
      const cleanup = callback()
      if (cleanup) mediaCleanups.push(cleanup)
    },
    revert: () => {
      mocks.matchMediaRevert()
      mediaCleanups.splice(0).forEach((cleanup) => cleanup())
    },
  }))
  mocks.gsap.from.mockReturnValue({ kill: vi.fn() })
  mocks.gsap.fromTo.mockReturnValue({})
  mocks.SplitText.create.mockReturnValue({ revert: vi.fn() })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('useLandingScroll reduced motion', () => {
  it('writes no styles at all when the user asks for reduced motion', () => {
    // The media query does not match, so GSAP never runs the context.
    mocks.gsap.matchMedia.mockImplementation(() => ({
      add: vi.fn(),
      revert: mocks.matchMediaRevert,
    }))

    render(<MotionHarness rootElement={root} progressElement={progress} />)

    expect(mocks.gsap.set).not.toHaveBeenCalled()
    expect(mocks.gsap.to).not.toHaveBeenCalled()
    expect(mocks.gsap.from).not.toHaveBeenCalled()
    expect(mocks.gsap.fromTo).not.toHaveBeenCalled()
    expect(mocks.ScrollTrigger.batch).not.toHaveBeenCalled()
    expect(mocks.SplitText.create).not.toHaveBeenCalled()
  })
})

describe('useLandingScroll reveals', () => {
  it('batches reveals once per group and puts the trust strip on its own line', () => {
    render(<MotionHarness rootElement={root} />)

    expect(mocks.ScrollTrigger.batch).toHaveBeenCalledTimes(2)

    const [firstTargets, firstVars] = mocks.ScrollTrigger.batch.mock.calls[0] as [
      HTMLElement[],
      BatchVars,
    ]
    const [secondTargets, secondVars] = mocks.ScrollTrigger.batch.mock.calls[1] as [
      HTMLElement[],
      BatchVars,
    ]

    expect(firstTargets).toEqual([card])
    expect(firstVars.start).toBe('top 88%')
    expect(firstVars.once).toBe(true)

    expect(secondTargets).toEqual([card])
    expect(secondVars.start).toBe('top 92%')
    expect(secondVars.once).toBe(true)
  })

  it('plays a batch with the shared reveal feel', () => {
    render(<MotionHarness rootElement={root} />)
    const [, vars] = mocks.ScrollTrigger.batch.mock.calls[0] as [HTMLElement[], BatchVars]

    vars.onEnter([card])

    expect(mocks.gsap.to).toHaveBeenCalledWith([card], {
      autoAlpha: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power3.out',
      overwrite: true,
    })
  })
})

describe('useLandingScroll progress bar', () => {
  it('scrubs scaleX across the whole page', () => {
    render(<MotionHarness rootElement={root} progressElement={progress} />)

    expect(mocks.gsap.to).toHaveBeenCalledWith(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.15,
      },
    })
  })
})

describe('useLandingScroll heading masks', () => {
  it('splits each heading into masked lines that auto-re-split', () => {
    render(<MotionHarness rootElement={root} />)

    const config = splitConfig()
    expect(mocks.SplitText.create.mock.calls[0][0]).toBe(heading)
    expect(config.type).toBe('lines')
    expect(config.mask).toBe('lines')
    expect(config.autoSplit).toBe(true)
  })

  it('settles a re-split instead of replaying a heading that already revealed', () => {
    render(<MotionHarness rootElement={root} />)
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
    render(<MotionHarness rootElement={root} />)
    const config = splitConfig()
    const line = document.createElement('div')

    config.onSplit({ lines: [line] })
    config.onSplit({ lines: [line] })

    expect(mocks.gsap.from).toHaveBeenCalledTimes(2)
    expect(mocks.gsap.set).not.toHaveBeenCalledWith([line], { yPercent: 0 })
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

    render(<MotionHarness rootElement={root} />)

    const gaugeFrom = mocks.gsap.fromTo.mock.calls[0][1] as { clipPath: () => string }
    const gaugeTo = mocks.gsap.fromTo.mock.calls[0][2] as { clipPath: () => string }
    const splitTo = mocks.gsap.fromTo.mock.calls[1][2] as { clipPath: () => string }

    // 20px is `.gauge-card` below 768px; a hardcoded 2rem would render 32px.
    expect(gaugeFrom.clipPath()).toBe('inset(7% 6% round 20px)')
    expect(gaugeTo.clipPath()).toBe('inset(0% 0% round 20px)')
    expect(splitTo.clipPath()).toBe('inset(0% 0% round 32px)')
  })
})

describe('useLandingScroll lifecycle', () => {
  it('reverts the media context, the splits and the pending font refresh', () => {
    const { unmount } = render(<MotionHarness rootElement={root} progressElement={progress} />)
    const split = mocks.SplitText.create.mock.results[0].value as { revert: () => void }

    unmount()

    expect(mocks.cancelRefresh).toHaveBeenCalledTimes(1)
    expect(mocks.matchMediaRevert).toHaveBeenCalledTimes(1)
    expect(split.revert).toHaveBeenCalledTimes(1)
  })
})
