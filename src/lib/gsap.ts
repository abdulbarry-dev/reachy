import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

/**
 * Landing-motion entry point.
 *
 * `ScrollTrigger`, `SplitText` and `useGSAP` are registered here, once, at
 * module scope, so no landing component can register a different set or trip
 * the "plugin not registered" warning at runtime. Landing code imports from
 * this module rather than from the packages directly; when a new plugin is
 * needed it is added in exactly one place.
 *
 * App-level components (toasts, page transitions, fallbacks) deliberately keep
 * importing GSAP core directly: they need no scroll or split plugins, and
 * registering them here keeps those plugins inside the lazy-loaded landing
 * chunk instead of the main bundle.
 *
 * Registered:
 * - `ScrollTrigger` — scroll-linked motion (progress bar, reveals, scrubs)
 * - `SplitText`     — masked line reveals for display type
 * - `useGSAP`       — scoped, auto-reverted React integration
 */
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export { gsap, ScrollTrigger, SplitText, useGSAP }
