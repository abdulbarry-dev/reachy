import { Button, Col, Container, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

interface BrandingPoint {
  title: string
  desc: string
}

const BRANDING_POINTS: BrandingPoint[] = [
  {
    title: 'Clean Domain Health',
    desc: 'Keep sender accounts off lists by regulating outbound volume.',
  },
  {
    title: 'Fully Auditable Stack',
    desc: 'Open-source codebase runs entirely inside your control.',
  },
  {
    title: 'Vault-encrypted Secrets',
    desc: 'Zero plaintext SMTP credential storage in any database row.',
  },
  {
    title: 'Safe by Default',
    desc: 'Default rate limits keep you under Gmail behavioral thresholds.',
  },
]

export function SplitSection() {
  const navigate = useNavigate()

  return (
    <section className="lp-section">
      <Container>
        <Row className="align-items-center g-5">
          <Col lg={5}>
            <div className="split-img-card" data-motion="curtain">
              <img src="/reachy-logo.png" alt="Reachy logo branding" />
              <div className="split-overlay-tag">
                <span style={{ fontSize: '1.35rem' }}>90 / day</span>
                <span className="small text-secondary">Maximum Safety Recommended</span>
              </div>
            </div>
          </Col>

          <Col lg={7}>
            <div className="split-text-col" data-motion="reveal">
              <span className="lp-badge mb-3">Branding &amp; Philosophy</span>
              <h2 className="display-6 fw-bold mb-4 text-dark">Crafted for Clean Outreach</h2>
              <p className="text-muted mb-4">
                We believe cold outreach should be intentional, highly targeted, and technically
                secure. Reachy is designed so that you cannot accidentally trigger filters. By
                enforcing strict sending schedules and secure Vault infrastructure, your branding
                remains spotless.
              </p>

              <div className="row g-3 mb-5">
                {BRANDING_POINTS.map((item) => (
                  <div key={item.title} className="col-sm-6">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-check-circle-fill text-success" />
                      <strong className="text-dark">{item.title}</strong>
                    </div>
                    <div className="small text-muted">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="split-bottom-cta-banner">
                <div>
                  <div className="fw-bold text-dark">Ready to improve deliverability?</div>
                  <div className="small text-muted">
                    Launch campaigns with our default safety parameters.
                  </div>
                </div>
                <Button className="btn-lp-primary" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
