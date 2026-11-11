import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { HeroSection } from './landing/HeroSection'
import { LandingNav } from './landing/LandingNav'
import {
  DeliverabilitySection,
  FeaturesSection,
  LANDING_SECTIONS,
  LandingFooter,
  PlaygroundSection,
  SplitSection,
  TrustStripSection,
  WorkflowSection,
} from './landing/sections'
import { useLandingScroll } from './landing/useLandingScroll'
import './LandingPage.css'

/**
 * Composition root for the landing route.
 *
 * Each section owns its own markup, copy and local state; this file owns only
 * the things that must be shared: the scroll container, the reading-progress
 * bar, the nav, and the scroll-spy that feeds it. Motion is declared by the
 * sections themselves through `data-motion` attributes, so adding or moving a
 * section never requires touching this file's animation code.
 */
export function LandingPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeSection, setActiveSection] = useState('')
  const landingRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // ── Active section via IntersectionObserver ──
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    LANDING_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.35 },
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // ── Landing scroll motion (progress, reveals, heading masks, curtains) ──
  useLandingScroll(landingRef, progressBarRef)

  return (
    <div ref={landingRef} className="landing-wrapper">
      {/* ── Top Scroll Progress Bar (GSAP ScrollTrigger Scrub) ── */}
      <div ref={progressBarRef} className="landing-scroll-progress" aria-hidden="true" />

      {/* ── Decorative Background Blobs ── */}
      <div className="lp-blob lp-blob-1" aria-hidden="true" />
      <div className="lp-blob lp-blob-2" aria-hidden="true" />
      <div className="lp-blob lp-blob-3" aria-hidden="true" />

      <LandingNav user={!!user} activeSection={activeSection} />
      <HeroSection />
      <TrustStripSection />
      <FeaturesSection />
      <PlaygroundSection />
      <WorkflowSection />
      <DeliverabilitySection />
      <SplitSection />
      <LandingFooter />
    </div>
  )
}
