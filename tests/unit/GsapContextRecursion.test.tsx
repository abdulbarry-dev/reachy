import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
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
})
