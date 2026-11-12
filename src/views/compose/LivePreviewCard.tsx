import { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { EmailPreview } from '../../components/EmailPreview'
import type { ImportedRecipient } from '../../types'

interface LivePreviewCardProps {
  recipients: ImportedRecipient[]
  subject: string
  body: string
}

/**
 * Renders the draft against one scratchpad recipient, with a Next control to
 * walk the list. Which recipient is being previewed is local to this card —
 * nothing else reads it.
 */
export function LivePreviewCard({ recipients, subject, body }: LivePreviewCardProps) {
  const [previewIndex, setPreviewIndex] = useState(0)
  const previewRecipient = recipients[previewIndex] ?? null

  return (
    <div className="h-100 min-w-0">
      <Card className="card-reachy border-0 h-100">
        <Card.Body className="p-4 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-4 preview-header-compact flex-wrap gap-2">
            <SectionHeader
              icon="bi-eye"
              title="Live preview"
              description="See how recipients view your email"
              className="min-w-0"
            />
            {recipients.length > 1 && (
              <Button
                variant="outline-primary"
                size="sm"
                className="btn-reachy-outline btn-reachy-sm"
                onClick={() => setPreviewIndex((i) => (i + 1) % recipients.length)}
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                Next
              </Button>
            )}
          </div>

          {previewRecipient ? (
            <EmailPreview
              subject={subject}
              body={body}
              recipient={previewRecipient}
            />
          ) : (
            <div className="empty-state flex-grow-1 d-flex align-items-center justify-content-center">
              <div>
                <div className="empty-state-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <h6 className="empty-state-title">No preview available</h6>
                <p className="empty-state-text">
                  Import recipients to the scratchpad to see a live preview of your personalized email.
                </p>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
