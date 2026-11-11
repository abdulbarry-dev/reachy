import type { ReactNode } from 'react'

interface SectionHeaderProps {
  /** Bootstrap Icons class, e.g. `bi-people`. */
  icon: string
  title: string
  description?: ReactNode
  /**
   * Layout classes for the header group itself, such as `mb-4`, `mb-3` or
   * `min-w-0`. Margins belong to the caller because sections nest inside
   * cards and rows with different spacing.
   */
  className?: string
}

/**
 * Icon + title + description, used as the heading of a card section.
 *
 * Eight copies existed across four pages. Several had already drifted (one
 * used `mb-3`, one needed `min-w-0` inside a flex row), which is exactly the
 * kind of difference that makes a page look almost-but-not-quite consistent.
 */
export function SectionHeader({ icon, title, description, className }: SectionHeaderProps) {
  const groupClass = className
    ? `d-flex align-items-center gap-3 ${className}`
    : 'd-flex align-items-center gap-3'

  return (
    <div className={groupClass}>
      <div className="section-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <h5 className="section-title mb-0">{title}</h5>
        {description !== undefined && <p className="text-muted small mb-0">{description}</p>}
      </div>
    </div>
  )
}
