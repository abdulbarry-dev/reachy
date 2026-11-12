import { useLayoutEffect, useRef, useState } from 'react'
import { Col, Container, Form, Row } from 'react-bootstrap'

interface MockRecipient {
  first_name: string
  company: string
  product: string
  email: string
}

const MOCK_RECIPIENTS: MockRecipient[] = [
  { first_name: 'Alex', company: 'Stripe', product: 'Payment APIs', email: 'alex@stripe.com' },
  { first_name: 'Elena', company: 'Vercel', product: 'Hosting', email: 'elena@vercel.com' },
  { first_name: 'Marcus', company: 'Figma', product: 'Design Tools', email: 'marcus@figma.com' },
]

const MERGE_VARIABLES = ['first_name', 'company', 'product']

const DEFAULT_TEMPLATE =
  'Hi {{first_name}},\n\nI noticed you work at {{company}}. Would you be open to checking out Reachy to automate personalized campaigns for {{product}}?\n\nBest,\nSarah'

export function PlaygroundSection() {
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE)
  const [selectedRecipientIdx, setSelectedRecipientIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /** Caret to restore once React has committed the new template text. */
  const pendingCaretRef = useRef<number | null>(null)

  const recipient = MOCK_RECIPIENTS[selectedRecipientIdx]

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const updatedText = text.substring(0, start) + `{{${variable}}}` + text.substring(end)
    pendingCaretRef.current = start + variable.length + 4
    setTemplateText(updatedText)
  }

  // Moving the caret has to wait until the new value is in the DOM. Doing it
  // in a timeout made the caret jump twice and left a timer alive per click;
  // a layout effect runs after the commit and before paint.
  useLayoutEffect(() => {
    const caret = pendingCaretRef.current
    if (caret === null) return
    pendingCaretRef.current = null

    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(caret, caret)
  }, [templateText])

  const renderedPreview = templateText
    .replaceAll('{{first_name}}', recipient.first_name)
    .replaceAll('{{company}}', recipient.company)
    .replaceAll('{{product}}', recipient.product)

  return (
    <section id="playground" className="lp-section lp-section-tint">
      <Container>
        <div className="section-header text-center">
          <span className="lp-badge mb-2" data-motion="reveal">
            Live Playground
          </span>
          <h2 data-motion="heading">Personalize Templates Live</h2>
          <p className="text-muted" data-motion="reveal">
            Type custom templates, click variables to insert tags, and toggle between target
            prospects to see personalized text instantly.
          </p>
        </div>

        <div className="widget-container" data-motion="reveal">
          <Row className="g-4">
            <Col lg={6}>
              <div className="pe-lg-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-bold small text-uppercase text-secondary">
                    1. Dynamic Merge Variables
                  </span>
                  <span className="small text-muted">Click tag to insert</span>
                </div>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  {MERGE_VARIABLES.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      className="widget-var-badge"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </button>
                  ))}
                </div>

                <Form.Group className="mb-3" controlId="playground-template">
                  <Form.Label className="fw-bold small text-uppercase text-secondary">
                    2. Compose Email Content
                  </Form.Label>
                  <Form.Control
                    ref={textareaRef}
                    as="textarea"
                    rows={6}
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    className="border rounded-3 p-3 font-monospace"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <div>
                  <div className="fw-bold small text-uppercase text-secondary mb-2">
                    3. Select Target Prospect
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {MOCK_RECIPIENTS.map((mockRecipient, index) => (
                      <button
                        key={mockRecipient.email}
                        type="button"
                        onClick={() => setSelectedRecipientIdx(index)}
                        className={`lp-prospect-pill ${selectedRecipientIdx === index ? 'active' : ''}`}
                      >
                        {mockRecipient.first_name} ({mockRecipient.company})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className="ps-lg-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-bold small text-uppercase text-secondary">
                    Recipient Preview
                  </span>
                  <span className="small text-muted font-monospace">{recipient.email}</span>
                </div>

                <div className="widget-preview-box">
                  <div className="widget-preview-header">
                    <div>
                      <strong>To:</strong> {recipient.first_name}
                      &nbsp;&lt;{recipient.email}&gt;
                    </div>
                    <div>
                      <strong>From:</strong> Sarah @ Reachy Campaigns
                    </div>
                    <div>
                      <strong>Subject:</strong> Quick question regarding {recipient.company}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{renderedPreview}</div>
                </div>

                <div className="lp-info-banner mt-4 d-flex align-items-start gap-2">
                  <i className="bi bi-info-circle-fill mt-1" aria-hidden="true" />
                  <div className="small">
                    Import columns directly from CSV headers. Reachy automatically validates and
                    inserts values into campaign queues.
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  )
}
