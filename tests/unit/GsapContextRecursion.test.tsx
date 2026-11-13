import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { HeroSection } from '../../src/views/landing/HeroSection'
import { gsap } from '../../src/lib/gsap'

function stubMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      let matches = false
      if (query.includes('prefers-reduced-motion: no-preference')) matches = true
      if (query.includes('hover: hover')) matches = true
      return {
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: () => true,
      }
    }),
  )
}

describe('GSAP Lifecycle and Context Recursion Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubMatchMedia()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('mounts, double-renders in StrictMode, and unmounts without throwing recursion or call-stack errors', () => {
    const revertSpy = vi.spyOn(gsap.core.Animation.prototype, 'revert')

    expect(() => {
      const { unmount } = render(
        <React.StrictMode>
          <HeroSection />
        </React.StrictMode>,
      )
      unmount()
    }).not.toThrow()

    expect(revertSpy).toHaveBeenCalled()
  })

  it('advances through multiple dispatch cycles, handles step clicks, and unmounts without recursion errors', () => {
    const revertSpy = vi.spyOn(gsap.core.Animation.prototype, 'revert')

    const { container, unmount } = render(
      <React.StrictMode>
        <HeroSection />
      </React.StrictMode>,
    )

    const baseTime = gsap.globalTimeline.time()

    expect(() => {
      act(() => {
        gsap.globalTimeline.time(baseTime + 4.0)
      })
      act(() => {
        gsap.globalTimeline.time(baseTime + 8.0)
      })

      const stepButtons = container.querySelectorAll<HTMLButtonElement>('.hero-step-item')
      expect(stepButtons.length).toBeGreaterThan(1)
      act(() => {
        fireEvent.click(stepButtons[1])
      })

      act(() => {
        gsap.globalTimeline.time(baseTime + 12.2)
      })

      unmount()
    }).not.toThrow()

    expect(revertSpy).toHaveBeenCalled()
  })
})
