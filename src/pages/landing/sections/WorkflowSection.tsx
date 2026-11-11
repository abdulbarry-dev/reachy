import { Col, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'

interface WorkflowStep {
  num: string
  title: string
  desc: string
  link: string
  highlighted: boolean
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    num: '1',
    title: 'Connect SMTP Link',
    desc: 'Log in, enter your SMTP details and Google App Password. Our connect-email-account Deno script immediately tests validation status.',
    link: 'Set Up Now',
    highlighted: false,
  },
  {
    num: '2',
    title: 'Create & Parse CSV',
    desc: 'Upload CSV list of leads with merge headers. Review variables, write templates with custom merge fields, and set hourly/daily throttle limits.',
    link: 'Upload Contacts',
    highlighted: true,
  },
  {
    num: '3',
    title: 'Auto-pilot Dispatch',
    desc: 'Queue the campaign. Postgres scheduler handles sends one-by-one, pacing delivery at precise sending intervals to keep Google servers happy.',
    link: 'Launch Queue',
    highlighted: false,
  },
]

export function WorkflowSection() {
  return (
    <section id="workflow" className="lp-section">
      <Container>
        <div className="section-header text-center">
          <span className="lp-badge mb-2" data-motion="reveal">
            Simple Setup
          </span>
          <h2 data-motion="heading">How Reachy Automated Outbound</h2>
          <p className="text-muted" data-motion="reveal">
            Get running in minutes. Our architecture ensures your cold email campaign stays within
            parameters.
          </p>
        </div>

        <div className="row g-4">
          {WORKFLOW_STEPS.map((step) => (
            <Col lg={4} key={step.num}>
              <div
                className={`step-card ${step.highlighted ? 'highlighted' : ''}`}
                data-motion="reveal"
              >
                <div className="step-num-badge">{step.num}</div>
                <h4
                  className={`step-title fw-bold mb-3 ${step.highlighted ? 'text-white' : 'text-dark'}`}
                >
                  {step.title}
                </h4>
                <p className="step-desc mb-3">{step.desc}</p>
                <Link to="/signup" className="step-link">
                  {step.link} <i className="bi bi-chevron-right" />
                </Link>
              </div>
            </Col>
          ))}
        </div>
      </Container>
    </section>
  )
}
