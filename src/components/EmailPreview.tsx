import { memo, useMemo } from 'react'
import type { ImportedRecipient } from '../types'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface EmailPreviewProps {
  subject: string
  body: string
  recipient: ImportedRecipient | null
}

export const EmailPreview = memo(function EmailPreview({ subject, body, recipient }: EmailPreviewProps) {
  const personalizedSubject = useMemo(() => {
    if (!recipient) return subject || '(no subject)'
    return subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
      if (key === 'email') return recipient.email
      if (key === 'name') return recipient.name ?? ''
      if (key === 'company') return recipient.company ?? ''
      return recipient.variables?.[key] ?? ''
    })
  }, [subject, recipient])

  const previewHtml = useMemo(() => {
    if (!recipient) return ''
    return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
      let val = ''
      if (key === 'email') val = recipient.email
      else if (key === 'name') val = recipient.name ?? ''
      else if (key === 'company') val = recipient.company ?? ''
      else val = recipient.variables?.[key] ?? ''
      return escapeHtml(val)
    })
  }, [body, recipient])

  return (
    <div className="d-flex flex-column flex-grow-1">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-person-fill text-muted small" />
        <span className="small text-muted">Previewing for</span>
        <strong className="small text-dark">{recipient?.email}</strong>
      </div>
      <div className="preview-frame flex-grow-1">
        <div className="preview-header">
          <p className="text-muted small mb-0">Subject</p>
          <p className="fw-semibold mb-0 text-dark" style={{ fontSize: '0.95rem' }}>
            {personalizedSubject || '(no subject)'}
          </p>
        </div>
        <div className="preview-body flex-grow-1">
          <div className="email-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>

      <div className="mt-4">
        <h6 className="text-muted small text-uppercase fw-bold mb-2" style={{ letterSpacing: '0.06em' }}>Available variables</h6>
        <div className="d-flex flex-wrap gap-2">
          <span className="var-chip">{"{"}{"{"}email{"}"}{"}"}</span>
          <span className="var-chip">{"{"}{"{"}name{"}"}{"}"}</span>
          <span className="var-chip">{"{"}{"{"}company{"}"}{"}"}</span>
        </div>
      </div>
    </div>
  )
})

EmailPreview.displayName = 'EmailPreview'
