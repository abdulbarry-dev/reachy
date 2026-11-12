import { useEffect } from 'react'
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCounter } from '../../src/views/landing/useCounter'

/**
 * The hero counters run three 1.2–1.6s animations at once. The original
 * implementation called `setState` on every frame, so the whole hero subtree
 * reconciled ~250 times during the entrance. These tests pin the replacement
 * contract: the counter writes text into a ref'd node, so the component renders
 * once and the browser's own text node changes.
 */

const formatInt = (value: number) => String(value)
const formatTenths = (value: number) => `${(value / 10).toFixed(1)}%`

let renders = 0

function Harness({
  started,
  format = formatInt,
  target = 120,
}: {
  started: boolean
  format?: (value: number) => string
  target?: number
}) {
  useEffect(() => {
    renders += 1
  })
  const ref = useCounter(target, 1000, started, format)
  return <span ref={ref} />
}

beforeEach(() => {
  renders = 0
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCounter', () => {
  it('writes the final value without re-rendering per frame', () => {
    const { container } = render(<Harness started />)
    const node = container.querySelector('span') as HTMLSpanElement

    vi.advanceTimersByTime(1200)

    expect(node.textContent).toBe('120')
    // One render for the component, zero from the counter's frames.
    expect(renders).toBe(1)
  })

  it('holds at zero until the hero becomes visible, then counts up', () => {
    const { container, rerender } = render(<Harness started={false} />)
    const node = container.querySelector('span') as HTMLSpanElement

    vi.advanceTimersByTime(1200)
    expect(node.textContent).toBe('0')

    rerender(<Harness started />)
    vi.advanceTimersByTime(1200)
    expect(node.textContent).toBe('120')
  })

  it('renders through the supplied formatter', () => {
    const { container } = render(<Harness started format={formatTenths} target={246} />)
    const node = container.querySelector('span') as HTMLSpanElement

    vi.advanceTimersByTime(1400)
    expect(node.textContent).toBe('24.6%')
  })

  it('cancels the animation when it unmounts mid-flight', () => {
    const { container, unmount } = render(<Harness started />)
    const node = container.querySelector('span') as HTMLSpanElement

    vi.advanceTimersByTime(300)
    const mid = node.textContent
    unmount()
    vi.advanceTimersByTime(2000)

    expect(node.textContent).toBe(mid)
  })
})
