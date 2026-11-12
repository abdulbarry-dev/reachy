import { Col, Container, Row } from 'react-bootstrap'
import Link from 'next/link'
import { LogoSvg } from '../LogoSvg'

interface SocialLink {
  icon: string
  href: string
  label: string
}

interface FooterLink {
  href: string
  label: string
}

const SOCIAL_LINKS: SocialLink[] = [
  { icon: 'bi-github', href: 'https://github.com/abdulbarry-dev/reachy', label: 'GitHub' },
  { icon: 'bi-twitter-x', href: 'https://x.com/AbdulbarryG', label: 'X (Twitter)' },
  { icon: 'bi-linkedin', href: 'https://www.linkedin.com/in/abdulbarryguenichi/', label: 'LinkedIn' },
]

const PRODUCT_LINKS: FooterLink[] = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'How It Works' },
  { href: '#playground', label: 'Playground' },
  { href: '#deliverability', label: 'Deliverability Model' },
]

/** Read once at module scope: the footer must not call an impure getter per render. */
const COPYRIGHT_YEAR = new Date().getFullYear()

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <Container>
        <Row className="g-4 mb-5 border-bottom border-secondary pb-5">
          <Col lg={4}>
            <div>
              <a href="#" className="lp-footer-brand mb-3">
                <LogoSvg />
                <span>Reachy</span>
              </a>
              <p className="small text-secondary mb-3 mt-3">
                Secure cold email automation designed to respect sending thresholds and safeguard
                sender credentials.
              </p>
              <div className="d-flex gap-3 text-secondary" style={{ fontSize: '1.25rem' }}>
                {SOCIAL_LINKS.map(({ icon, href, label }) => (
                  <a
                    key={icon}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-secondary"
                    aria-label={label}
                  >
                    <i className={`bi ${icon}`} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={6} lg={4}>
            <div>
              <h6 className="text-white fw-bold mb-3">Product</h6>
              <div className="d-flex flex-column gap-2">
                {PRODUCT_LINKS.map((item) => (
                  <a key={item.href} href={item.href} className="lp-footer-link">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={6} lg={4}>
            <div>
              <h6 className="text-white fw-bold mb-3">Security &amp; Auth</h6>
              <div className="d-flex flex-column gap-2">
                <Link href="/login" className="lp-footer-link">
                  Sign In
                </Link>
                <Link href="/signup" className="lp-footer-link">
                  Create Account
                </Link>
                <a
                  href="https://supabase.com/docs/guides/database/vault"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-footer-link"
                >
                  Supabase Vault Docs{' '}
                  <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            </div>
          </Col>
        </Row>

        <div className="d-flex flex-wrap justify-content-between align-items-center text-secondary small">
          <div>&copy; {COPYRIGHT_YEAR} Reachy Inc. All rights reserved.</div>
          <div className="d-flex gap-3 mt-2 mt-sm-0">
            <a href="#" className="lp-footer-link small">
              Privacy Policy
            </a>
            <a href="#" className="lp-footer-link small">
              Terms of Service
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
