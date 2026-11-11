import { Container } from 'react-bootstrap'

interface TrustSignal {
  icon: string
  label: string
  code: string | null
}

const TRUST_SIGNALS: TrustSignal[] = [
  { icon: 'bi-google text-danger', label: 'Gmail Integration', code: null },
  { icon: 'bi-shield-lock-fill text-primary', label: 'Supabase Vault', code: null },
  { icon: 'bi-cpu-fill text-warning', label: 'Deno Edge Runtime', code: null },
  { icon: 'bi-clock-history text-success', label: 'Scheduling', code: 'pg_cron' },
]

/**
 * The band directly under the hero. Its items use the above-fold reveal, so the
 * whole strip plays on load instead of showing its label with the logos hidden.
 */
export function TrustStripSection() {
  return (
    <section className="py-4">
      <Container>
        <div className="logos-slider-container">
          <span className="small text-uppercase fw-bold text-secondary me-lg-4">
            Secured With:
          </span>
          {TRUST_SIGNALS.map((item) => (
            <div key={item.label} className="logo-item" data-motion="reveal-above-fold">
              <i className={`bi ${item.icon}`} />
              {item.code ? (
                <>
                  <span className="logo-code-pill">{item.code}</span> {item.label}
                </>
              ) : (
                item.label
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
