'use client'

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
  // Select the user only: `loading` changes during session restore and would
  // otherwise re-render the whole landing tree for a value nothing here reads.
  const user = useSelector((state: RootState) => state.auth.user)
  const [activeSection, setActiveSection] = useState('')
  const landingRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // ── Sync root html & body background to deep-space cosmos #070a12 on landing ──
  // Prevents any rubber-band / overscroll bounce from flashing light background
  useEffect(() => {
    const htmlEl = document.documentElement
    const bodyEl = document.body
    const originalHtmlBg = htmlEl.style.backgroundColor
    const originalBodyBg = bodyEl.style.backgroundColor

    htmlEl.style.backgroundColor = '#070a12'
    bodyEl.style.backgroundColor = '#070a12'

    return () => {
      htmlEl.style.backgroundColor = originalHtmlBg
      bodyEl.style.backgroundColor = originalBodyBg
    }
  }, [])

  // ── Active section via IntersectionObserver ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { threshold: 0.35 },
    )

    LANDING_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
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
      <FeaturesSection />
      <PlaygroundSection />
      <WorkflowSection />
      <DeliverabilitySection />
      <SplitSection />
      <LandingFooter />
    </div>
  )
}
