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

/**
 * The trust strip sits directly under the hero, so it is often already on
 * screen at load. A shallower start line lets the whole band play immediately
 * instead of showing its label while the logos stay hidden.
 */
const TRUST_STRIP_REVEAL_START = 'top 92%'

/** Shared entrance feel: decisive, short, no overshoot (DESIGN.md §6). */
const REVEAL_EASE = 'power3.out'

const REVEAL_DURATION = 0.55
const REVEAL_DISTANCE = 24

/**
 * The motion contract. Markup opts in with a `data-motion` attribute; the hook
 * never names a page section, a class or an id, so restructuring the page can
 * never silently disable motion.
 */
const REVEAL_TARGET = '[data-motion="reveal"]'

/** The band under the hero that is usually already on screen at load. */
const ABOVE_FOLD_REVEAL_TARGET = '[data-motion="reveal-above-fold"]'

/** Section headings that get split into masked lines. */
const HEADING_TARGET = '[data-motion="heading"]'

/** Cards that open out of a clipped inset. */
const CURTAIN_TARGET = '[data-motion="curtain"]'

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
        revealGroups(root, REVEAL_TARGET)

        // The trust strip sits just under the hero, so it is often already on
        // screen at load. A shallower start line lets it play immediately
        // instead of showing its label with the logos still hidden.
        revealGroups(root, ABOVE_FOLD_REVEAL_TARGET, TRUST_STRIP_REVEAL_START)

        // SplitText owns DOM outside GSAP's context, so it is reverted by hand.
        const splits = maskRevealHeadings(root)

        curtainReveal(root)

        return () => splits.forEach((split) => split.revert())
      })

      // Fonts change line heights; re-measure once they have settled.
      const cancelRefresh = refreshAfterFonts()

      return () => {
        cancelRefresh()
        matchMedia.revert()
      }
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
function revealGroups(root: HTMLElement, selector: string, start = REVEAL_START): void {
  const targets = gsap.utils.toArray<HTMLElement>(selector, root)
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
 * `autoSplit` re-splits when the web font loads or the viewport changes, and
 * `onSplit` returns the tween so GSAP keeps the reveal time-synced with the
 * rebuilt lines.
 *
 * Re-splits are why the `revealed` set exists. GSAP reverts the previous
 * `onSplit` tween before calling it again, so a heading that already played
 * would replay from behind its mask — a visible flash mid-read. Once a heading
 * has revealed, later splits simply settle it. A heading that has *not* revealed
 * still rebuilds its tween, so one that is off-screen is never left stuck.
 */
function maskRevealHeadings(root: HTMLElement): SplitText[] {
  const headings = gsap.utils.toArray<HTMLElement>(HEADING_TARGET, root)
  const revealed = new WeakSet<HTMLElement>()

  return headings.map((heading) =>
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (split) => {
        if (revealed.has(heading)) {
          return gsap.set(split.lines, { yPercent: 0 })
        }

        return gsap.from(split.lines, {
          yPercent: 110,
          duration: 0.7,
          stagger: 0.08,
          ease: REVEAL_EASE,
          onStart: () => revealed.add(heading),
          scrollTrigger: {
            trigger: heading,
            start: REVEAL_START,
            once: true,
          },
        })
      },
    }),
  )
}

/**
 * Builds an inset clip whose corner radius matches the element's own computed
 * radius.
 *
 * The radius is owned by CSS — `.gauge-card` is `2rem` on desktop and `1.25rem`
 * below 768px — so reading it at tween start keeps the settled clip identical
 * to the static card at every breakpoint. A constant here silently overrides
 * the design's mobile radius.
 */
function curtainClip(inset: string, target: HTMLElement): string {
  const radius = getComputedStyle(target).borderRadius || '0px'
  return `inset(${inset} round ${radius})`
}

/**
 * Opens each marked card out of a clipped inset, keeping its own radius so the
 * settled card is indistinguishable from its static CSS state.
 */
function curtainReveal(root: HTMLElement): void {
  const targets = gsap.utils.toArray<HTMLElement>(CURTAIN_TARGET, root)

  for (const target of targets) {
    gsap.fromTo(
      target,
      {
        autoAlpha: 0,
        y: REVEAL_DISTANCE + 4,
        clipPath: () => curtainClip('7% 6%', target),
      },
      {
        autoAlpha: 1,
        y: 0,
        clipPath: () => curtainClip('0% 0%', target),
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
}
