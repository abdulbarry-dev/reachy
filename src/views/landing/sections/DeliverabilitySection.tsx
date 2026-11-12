import { useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { AnimatePresence, motion } from 'framer-motion'
import { StarfieldCanvas } from '../StarfieldCanvas'

interface SafetyInfo {
  status: string
  class: string
  icon: string
  deliverability: string
  desc: string
}

function getSafetyInfo(sends: number): SafetyInfo {
  if (sends <= 90) {
    return {
      status: 'Safe',
      class: 'status-safe',
      icon: 'bi-shield-check',
      deliverability: '99%',
      desc: 'Ideal for free Gmail accounts. Stays well under behavioral triggers to guarantee inbox delivery.',
    }
  }
  if (sends <= 200) {
    return {
      status: 'Warning',
      class: 'status-warning',
      icon: 'bi-exclamation-triangle',
      deliverability: '82%',
      desc: 'Approaching limits. Google may begin routing high volumes to promotions or temporary delay queues.',
    }
  }
  return {
    status: 'Risky',
    class: 'status-risky',
    icon: 'bi-shield-slash',
    deliverability: '54%',
    desc: 'High risk of ban. Standard Gmail limits are 100/day for manual send behaviors. Spam filters will block you.',
  }
}

export function DeliverabilitySection() {
  const [dailySends, setDailySends] = useState(90)
  const safetyInfo = getSafetyInfo(dailySends)

  return (
    <section id="deliverability" className="lp-section lp-section-tint">
      <Container>
        <div className="section-header text-center">
          <span className="lp-badge mb-2" data-motion="reveal">
            Deliverability Advisor
          </span>
          <h2 data-motion="heading">Adjust Sending Speed Safely</h2>
          <p className="text-muted" data-motion="reveal">
            Gmail limits and thresholds are behavioral. Slide daily sends to analyze risk factors.
          </p>
        </div>

        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="gauge-card" data-motion="curtain">
              <div className="gauge-cosmos" aria-hidden="true">
                <StarfieldCanvas className="gauge-stars" starCount={70} />
                <div className="gauge-aurora gauge-aurora-1" />
                <div className="gauge-aurora gauge-aurora-2" />
              </div>
              <Row className="align-items-center gauge-content">
                <Col md={6} className="mb-4 mb-md-0">
                  <h4 className="fw-bold mb-3 text-white">Daily Volume Gauge</h4>
                  <p className="text-secondary small mb-4">
                    Dragging this slider simulates how Google Workspace spam heuristics analyze your
                    outbound behaviors.
                  </p>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-secondary">Target Daily Cap</span>
                      <strong className="text-white" style={{ fontSize: '1.25rem' }}>
                        {dailySends} emails/day
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      value={dailySends}
                      onChange={(e) => setDailySends(parseInt(e.target.value))}
                      className="slider-custom"
                      aria-label="Daily send volume slider"
                    />
                    <div className="d-flex justify-content-between small text-secondary mt-1">
                      <span>10 (Minimum)</span>
                      <span>500 (Maximum)</span>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="ps-md-4 text-center text-md-start border-start-md border-secondary-subtle">
                    <div className="small text-secondary mb-2">RISK EVALUATION</div>
                    <div className={`status-badge-lg mb-3 ${safetyInfo.class}`}>
                      <i className={`bi ${safetyInfo.icon}`} /> {safetyInfo.status} Status
                    </div>

                    <div className="mb-3">
                      <div className="small text-secondary">ESTIMATED INBOX DELIVERABILITY</div>
                      <div className="display-4 fw-bold text-white">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={safetyInfo.deliverability}
                            initial={{ y: 14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -14, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            style={{ display: 'inline-block' }}
                          >
                            {safetyInfo.deliverability}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className="small text-secondary mb-0">{safetyInfo.desc}</p>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
