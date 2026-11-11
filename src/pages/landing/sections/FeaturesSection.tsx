import { Col, Container } from 'react-bootstrap'

interface FeatureCard {
  badge: string
  icon: string
  title: string
  code: string | null
  desc: string
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    badge: 'SECURE',
    icon: 'bi-safe2',
    title: 'Vault Encryption',
    code: null,
    desc: 'Your SMTP credentials are kept out of plaintext databases. They are encrypted using pg_vault and read only inside isolated Edge Functions during dispatch.',
  },
  {
    badge: 'COMPLIANT',
    icon: 'bi-arrow-repeat',
    title: 'Smart Inbox Rotation',
    code: null,
    desc: 'Keep daily sending volumes small (under 90/day) across multiple connected accounts to bypass Gmail spam detection and build long-term IP reputation.',
  },
  {
    badge: 'AUTOMATED',
    icon: 'bi-calendar-check',
    title: 'Dispatching',
    code: 'pg_cron',
    desc: "Our send pipeline isn't a simple loop that runs into timeouts. A postgres scheduler triggers a dispatch tick every 60s, keeping sending rhythmic and natural.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="lp-section">
      <Container>
        <div className="section-header text-center">
          <span className="lp-badge mb-2" data-motion="reveal">
            Features Suite
          </span>
          <h2 data-motion="heading">Designed to Prevent Spam Triggers</h2>
          <p className="text-muted" data-motion="reveal">
            Unlike generic bulk mail tools, Reachy structures every aspect of the send pipeline
            around Gmail security principles.
          </p>
        </div>

        <div className="row g-4">
          {FEATURE_CARDS.map((card) => (
            <Col md={4} key={card.title}>
              <div className="feature-card" data-motion="reveal">
                <div className="feature-badge">{card.badge}</div>
                <div className="feature-icon-box">
                  <i className={`bi ${card.icon}`} />
                </div>
                <h4 className="fw-bold text-dark mb-3">
                  {card.code ? (
                    <>
                      <span className="feature-code-tag">{card.code}</span> {card.title}
                    </>
                  ) : (
                    card.title
                  )}
                </h4>
                <p className="text-muted mb-0">{card.desc}</p>
                {card.code && (
                  <div className="dispatch-diagram" aria-hidden="true">
                    <span className="dd-node">
                      <i className="bi bi-database" />
                    </span>
                    <span className="dd-wire">
                      <span className="dd-pulse" />
                    </span>
                    <span className="dd-tick">tick / 60s</span>
                    <span className="dd-wire dd-wire-late">
                      <span className="dd-pulse" />
                    </span>
                    <span className="dd-node">
                      <i className="bi bi-send" />
                    </span>
                  </div>
                )}
              </div>
            </Col>
          ))}
        </div>
      </Container>
    </section>
  )
}
