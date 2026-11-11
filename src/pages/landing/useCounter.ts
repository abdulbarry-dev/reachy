import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

type CounterFormatter = (value: number) => string

/**
 * Counts from zero to `target` and writes the result straight into a DOM node.
 *
 * The hero runs three of these at once. Driving them through state meant the
 * whole hero subtree reconciled on every animation frame — roughly 250 renders
 * for one entrance. Returning a ref keeps the animation out of React entirely:
 * the component renders once and only the text node changes.
 *
 * `format` must be stable (define it at module scope). An inline arrow would
 * restart the animation on every render.
 */
export function useCounter(
  target: number,
  duration = 1400,
  started = false,
  format: CounterFormatter = String,
): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)

  // Layout effect, not effect: the zero state must be on screen before the
  // first paint, otherwise the stat reads as an empty box for one frame.
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    if (!started) {
      node.textContent = format(0)
      return
    }

    let startTime: number | null = null
    let frame = 0

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = format(Math.floor(eased * target))

      // Only touch the DOM when the rendered text actually changes; the last
      // frames of a long count repeat the same rounded value.
      if (node.textContent !== next) node.textContent = next

      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, started, format])

  return ref
}
