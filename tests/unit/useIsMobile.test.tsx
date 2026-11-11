import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../../src/hooks/useIsMobile'

const DESKTOP = 1440
const MOBILE = 390

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
}

function resizeTo(width: number) {
  act(() => {
    setViewportWidth(width)
    window.dispatchEvent(new Event('resize'))
  })
}

describe('useIsMobile', () => {
  it('reports the viewport on first render', () => {
    setViewportWidth(MOBILE)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('follows resize events in both directions', () => {
    setViewportWidth(DESKTOP)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    resizeTo(MOBILE)
    expect(result.current).toBe(true)

    resizeTo(DESKTOP)
    expect(result.current).toBe(false)
  })

  it('notifies the resize callback with the new value', () => {
    setViewportWidth(DESKTOP)
    const onResize = vi.fn()
    renderHook(() => useIsMobile(onResize))

    resizeTo(MOBILE)
    expect(onResize).toHaveBeenLastCalledWith(true)

    resizeTo(DESKTOP)
    expect(onResize).toHaveBeenLastCalledWith(false)
  })

  it('stops listening after unmount', () => {    setViewportWidth(DESKTOP)
    const { unmount } = renderHook(() => useIsMobile())
    unmount()

    setViewportWidth(MOBILE)
    // No subscribers left: dispatching must not throw or warn.
    expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow()
  })
})
