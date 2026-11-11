// Shared landing-page motion constants.
//
// The landing page animates with GSAP (see landing/useLandingScroll.ts and
// HeroSection.tsx) and Framer Motion in the hero widgets; both need the same
// deceleration curve so a Framer transition and a GSAP tween feel like one
// system.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
