import { ScrollTrigger } from './gsap'

/**
 * Whether a refresh is already waiting on the web font.
 *
 * Several sections ask for the same thing at mount. Without this flag every
 * caller would queue its own `ScrollTrigger.refresh()`, and the final one would
 * measure the page while the previous ones are still moving pinned and revealed
 * elements around.
 */
let queued = false

/**
 * Re-measures every trigger once the display face has loaded.
 *
 * Web fonts change line heights, so triggers measured against the fallback face
 * drift by tens of pixels. `document.fonts.ready` resolves after the swap; the
 * refresh is deferred one frame so `SplitText`'s `autoSplit` pass has rebuilt
 * the lines before positions are read.
 *
 * Returns a cancel function for the owner's cleanup. Without it, navigating away
 * while the font is still loading would fire a global `ScrollTrigger.refresh()`
 * from a page that no longer has any triggers. A caller that did not queue the
 * refresh gets a no-op, so one component unmounting can never cancel another
 * component's pending refresh.
 */
export function refreshAfterFonts(): () => void {
  if (typeof document === 'undefined' || !document.fonts || queued) return () => {}

  queued = true
  let cancelled = false
  let frame = 0

  void document.fonts.ready.then(() => {
    if (cancelled) return
    queued = false

    if (typeof requestAnimationFrame === 'function') {
      frame = requestAnimationFrame(() => {
        if (!cancelled) ScrollTrigger.refresh()
      })
      return
    }

    ScrollTrigger.refresh()
  })

  return () => {
    cancelled = true
    queued = false

    if (frame !== 0 && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame)
    }
  }
}
