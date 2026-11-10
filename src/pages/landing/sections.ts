export interface LandingSection {
  id: 'features' | 'workflow' | 'playground' | 'deliverability'
  label: string
}

/**
 * Single source of truth for the landing page's navigable sections.
 * The header renders these as anchors and the page's scroll observer watches
 * the very same ids, so the two can never drift apart.
 */
export const LANDING_SECTIONS: readonly LandingSection[] = [
  { id: 'features', label: 'Features' },
  { id: 'workflow', label: 'How it Works' },
  { id: 'playground', label: 'Playground' },
  { id: 'deliverability', label: 'Deliverability' },
]
