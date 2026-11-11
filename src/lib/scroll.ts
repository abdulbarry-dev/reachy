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
 */
export function refreshAfterFonts(): void {
  if (typeof document === 'undefined' || !document.fonts || queued) return

  queued = true
  void document.fonts.ready.then(() => {
    queued = false

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }

    ScrollTrigger.refresh()
  })
}
