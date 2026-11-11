import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeroSection } from '../../src/pages/landing/HeroSection'

/**
 * The hero's pointer parallax used to read `getBoundingClientRect()` on every
 * pointermove and start four `quickTo` tweens per event — up to ~480 layout
 * reads and 960 tween writes per second on a trackpad.
 *
 * The contract pinned here: bursts of pointermove collapse into a single frame,
 * the frame uses the latest pointer position, and the element rect is measured
 * once per burst rather than once per event.
 */

const mocks = vi.hoisted(() => ({
  gsap: {
    matchMedia: vi.fn(),
    timeline: vi.fn(),
    to: vi.fn(),
    from: vi.fn(),
    set: vi.fn(),
    quickTo: vi.fn(),
  },
  SplitText: { create: vi.fn() },
}))

vi.mock('../../src/lib/gsap', async () => {
  const { useLayoutEffect } = await import('react')
  return {
    gsap: mocks.gsap,
    SplitText: mocks.SplitText,
    // Mirror useGSAP's "run once on mount" behaviour: re-running on every
    // render would stack duplicate listeners and hide coalescing bugs.
    useGSAP: (callback: () => void) => useLayoutEffect(callback, []),
  }
})

let frames: FrameRequestCallback[]

beforeEach(() => {
  vi.clearAllMocks()
  frames = []

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())

  mocks.gsap.matchMedia.mockImplementation(() => ({
    add: (
      _conditions: unknown,
      callback: (context: { conditions: Record<string, boolean> }) => (() => void) | void,
    ) => callback({ conditions: { motionOK: true, finePointer: true } }),
    revert: vi.fn(),
  }))

  const timeline = {
    from: vi.fn(() => timeline),
  }
  mocks.gsap.timeline.mockReturnValue(timeline)
  mocks.gsap.to.mockReturnValue({})
  mocks.gsap.from.mockReturnValue({})
  mocks.gsap.set.mockReturnValue({})
  mocks.gsap.quickTo.mockImplementation(() => vi.fn())
  mocks.SplitText.create.mockReturnValue({ revert: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubStageRect(card: HTMLElement) {
  return vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 1000,
    bottom: 500,
    width: 1000,
    height: 500,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('HeroSection pointer parallax', () => {
  it('collapses a burst of pointermove events into one frame using the latest position', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    )
    const card = container.querySelector('.hero-container-card') as HTMLElement
    const setters = mocks.gsap.quickTo.mock.results.map((result) => result.value as ReturnType<typeof vi.fn>)

    // 4 layers x (x, y)
    expect(setters).toHaveLength(8)

    // Drop frames queued by the counter entrance; this test owns the next one.
    frames.length = 0
    const rect = stubStageRect(card)

    fireEvent.pointerMove(card, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(card, { clientX: 300, clientY: 300 })
    fireEvent.pointerMove(card, { clientX: 750, clientY: 375 })

    // Nothing is written until the frame runs.
    expect(setters.every((setter) => setter.mock.calls.length === 0)).toBe(true)
    expect(frames).toHaveLength(1)
    expect(rect).not.toHaveBeenCalled()

    frames[0](16)

    // One rect read for the whole burst, not one per event.
    expect(rect).toHaveBeenCalledTimes(1)

    // Only the last position is applied: nx = 0.25, ny = 0.25.
    const calls = setters.map((setter) => setter.mock.calls[0]?.[0])
    expect(calls).toEqual([6, 3, 9, 4.5, 4, 2, 3, 1.5])
    expect(setters.every((setter) => setter.mock.calls.length === 1)).toBe(true)
  })

  it('recentres every layer on pointerleave', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    )
    const card = container.querySelector('.hero-container-card') as HTMLElement
    const setters = mocks.gsap.quickTo.mock.results.map((result) => result.value as ReturnType<typeof vi.fn>)

    fireEvent.pointerLeave(card)

    expect(setters.every((setter) => setter.mock.calls.length === 1)).toBe(true)
    expect(setters.every((setter) => setter.mock.calls[0][0] === 0)).toBe(true)
  })
})
