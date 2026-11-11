import type { RefObject } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { refreshAfterFonts } from '../../lib/scroll'

/**
 * Landing-page scroll choreography.
 *
 * One hook owns every scroll-driven motion on `/`, so the page component keeps
 * to content and the motion vocabulary stays in a single file:
 *
 * 1. Reading progress — a scrubbed `scaleX` across the whole page.
 * 2. Section reveals — badge, intro copy, cards and strips rise once as they
 *    enter, then stay put (`once: true`); nothing is ever hidden twice.
 * 3. Heading reveals — each section H2 is split into masked lines and slides up
 *    from behind its own mask, echoing the hero headline.
 * 4. Curtain reveals — the gauge and the split showcase open out of a clipped
 *    inset, which gives the two “moment” sections weight without adding any new
 *    visual elements.
 *
 * Everything runs inside `gsap.matchMedia("(prefers-reduced-motion:
 * no-preference)")`: with reduced motion the page simply renders its end state,
 * because no inline styles are ever applied.
 *
 * Motion only touches `transform`, `opacity`, `visibility` and `clip-path` —
 * never layout.
 */

const MOTION_OK = '(prefers-reduced-motion: no-preference)'

/** Where a reveal begins: as the element's top crosses 88% of the viewport. */
const REVEAL_START = 'top 88%'

/** Shared entrance feel: decisive, short, no overshoot (DESIGN.md §6). */
const REVEAL_EASE = 'power3.out'

const REVEAL_DURATION = 0.55
const REVEAL_DISTANCE = 24

/** Card radii are owned by CSS; the clip end state must match them exactly. */
const CARD_RADIUS = '2rem'

/** Everything that fades and rises as one batch. */
const REVEAL_SELECTORS = [
  '.section-header .lp-badge',
  '.section-header p',
  '#features .feature-card',
  '#playground .widget-container',
  '#workflow .step-card',
  '.split-text-col',
]

export function useLandingScroll(
  rootRef: RefObject<HTMLElement | null>,
  progressRef: RefObject<HTMLElement | null>,
): void {
  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const matchMedia = gsap.matchMedia()

      matchMedia.add(MOTION_OK, () => {
        trackReadingProgress(root, progressRef.current)
        revealGroups(root, REVEAL_SELECTORS)

        // The trust strip sits just under the hero, so it is often already on
        // screen at load. A shallower start line lets it play immediately
        // instead of showing its label with the logos still hidden.
        revealGroups(root, ['.logo-item'], 'top 92%')

        // SplitText owns DOM outside GSAP's context, so it is reverted by hand.
        const splits = maskRevealHeadings(root)

        curtainReveal(root, '#deliverability .gauge-card')
        curtainReveal(root, '.split-img-card')

        return () => splits.forEach((split) => split.revert())
      })

      // Fonts change line heights; re-measure once they have settled.
      refreshAfterFonts()

      return () => matchMedia.revert()
    },
    { scope: rootRef },
  )
}

/** Scrubbed indicator: empty at the top of the page, full at the bottom. */
function trackReadingProgress(root: HTMLElement, progress: HTMLElement | null): void {
  if (!progress) return

  gsap.to(progress, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.15,
    },
  })
}

/**
 * Batches elements that share a reveal, so a row of cards staggers as one
 * gesture instead of each card starting its own timeline.
 */
function revealGroups(root: HTMLElement, selectors: string[], start = REVEAL_START): void {
  const targets = gsap.utils.toArray<HTMLElement>(selectors.join(','), root)
  if (targets.length === 0) return

  gsap.set(targets, { autoAlpha: 0, y: REVEAL_DISTANCE })

  ScrollTrigger.batch(targets, {
    start,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: REVEAL_DURATION,
        stagger: 0.08,
        ease: REVEAL_EASE,
        overwrite: true,
      }),
  })
}

/**
 * Splits each section heading into lines and hides them behind per-line masks.
 *
 * `autoSplit` re-splits when the web font loads, and `onSplit` returns the tween
 * so GSAP keeps the reveal time-synced with the rebuilt lines.
 */
function maskRevealHeadings(root: HTMLElement): SplitText[] {
  const headings = gsap.utils.toArray<HTMLElement>('.section-header h2', root)

  return headings.map((heading) =>
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (split) =>
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 0.7,
          stagger: 0.08,
          ease: REVEAL_EASE,
          scrollTrigger: {
            trigger: heading,
            start: REVEAL_START,
            once: true,
          },
        }),
    }),
  )
}

/**
 * Opens a card out of a clipped inset. The end clip keeps the element's own
 * radius, so the settled card is indistinguishable from its static CSS state.
 */
function curtainReveal(root: HTMLElement, selector: string): void {
  const target = root.querySelector<HTMLElement>(selector)
  if (!target) return

  gsap.fromTo(
    target,
    {
      autoAlpha: 0,
      y: REVEAL_DISTANCE + 4,
      clipPath: `inset(7% 6% round ${CARD_RADIUS})`,
    },
    {
      autoAlpha: 1,
      y: 0,
      clipPath: `inset(0% 0% round ${CARD_RADIUS})`,
      duration: 0.9,
      ease: REVEAL_EASE,
      scrollTrigger: {
        trigger: target,
        start: REVEAL_START,
        once: true,
      },
    },
  )
}
