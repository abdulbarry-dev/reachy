import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** Right-aligned slot: a count badge or the page's primary action. */
  actions?: ReactNode
  /**
   * Extra class for the description paragraph.
   *
   * `page-header-desc` is a mobile-only type adjustment that not every page
   * uses, so it stays opt-in rather than being normalised across pages.
   */
  descriptionClassName?: string
}

/**
 * The title block every authenticated page opens with.
 *
 * It was copied into four pages, which is why the heading and description
 * classes had started to drift between them. Extracting it keeps the top of
 * every page on the same grid and rhythm.
 */
export function PageHeader({ title, description, actions, descriptionClassName }: PageHeaderProps) {
  const descriptionClass = descriptionClassName
    ? `text-muted mb-0 ${descriptionClassName}`
    : 'text-muted mb-0'

  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 mb-sm-5">
      <div>
        <h1 className="h2 mb-1 page-title">{title}</h1>
        {description !== undefined && <p className={descriptionClass}>{description}</p>}
      </div>
      {actions}
    </div>
  )
}
