import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../../src/components/PageHeader'
import { SectionHeader } from '../../src/components/SectionHeader'

describe('PageHeader', () => {
  it('renders the title as the page h1', () => {
    render(<PageHeader title="Recipients" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Recipients' })).toHaveClass('page-title')
  })

  it('renders a description when given one', () => {
    render(<PageHeader title="Settings" description="Manage senders" />)

    expect(screen.getByText('Manage senders')).toHaveClass('text-muted')
  })

  it('renders no description paragraph without a description', () => {
    const { container } = render(<PageHeader title="Settings" />)

    expect(container.querySelector('p')).toBeNull()
  })

  it('appends the optional description class', () => {
    render(<PageHeader title="Compose" description="Write once" descriptionClassName="page-header-desc" />)

    expect(screen.getByText('Write once')).toHaveClass('text-muted', 'mb-0', 'page-header-desc')
  })

  it('renders the actions slot', () => {
    render(<PageHeader title="Dashboard" actions={<button type="button">New campaign</button>} />)

    expect(screen.getByRole('button', { name: 'New campaign' })).toBeInTheDocument()
  })
})

describe('SectionHeader', () => {
  it('renders the icon, title and description', () => {
    const { container } = render(
      <SectionHeader icon="bi-cloud-arrow-up" title="Import from file" description="JSON, CSV, or Excel" />,
    )

    expect(screen.getByRole('heading', { level: 5, name: 'Import from file' })).toHaveClass('section-title')
    expect(screen.getByText('JSON, CSV, or Excel')).toHaveClass('small')
    expect(container.querySelector('.section-icon .bi-cloud-arrow-up')).not.toBeNull()
  })

  it('renders no description paragraph without a description', () => {
    const { container } = render(<SectionHeader icon="bi-eye" title="Preview" />)

    expect(container.querySelector('p')).toBeNull()
  })

  it('applies layout classes when given', () => {
    const { container } = render(<SectionHeader icon="bi-eye" title="Preview" className="mb-3" />)

    expect(container.firstElementChild).toHaveClass('d-flex', 'align-items-center', 'gap-3', 'mb-3')
  })

  it('keeps the base layout classes when no layout class is given', () => {
    const { container } = render(<SectionHeader icon="bi-eye" title="Preview" />)

    expect(container.firstElementChild).toHaveClass('d-flex', 'align-items-center', 'gap-3')
  })
})
