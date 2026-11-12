// Shared landing-page motion token.
//
// Two systems drive this page and they intentionally use different curves:
// GSAP's `power3.out` carries the scroll choreography and the hero entrance
// (DESIGN.md §6), while the small Framer Motion transitions — nav drawer, hero
// status pill — use this expo bezier, which finishes harder over their short
// 300–350ms durations. Do not assume a GSAP tween and a Framer transition feel
// interchangeable; match the system, not the number.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
