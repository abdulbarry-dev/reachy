import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DevErrorView } from '../../src/components/DevErrorView'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DevErrorView Component (Development Error Diagnostics)', () => {
  it('renders raw error name and actual unsanitized error message', () => {
    const error = new TypeError('Cannot read properties of undefined (reading "campaignId")')
    render(<DevErrorView error={error} />)

    expect(screen.getByText('DEVELOPMENT ERROR OVERLAY')).toBeInTheDocument()
    expect(screen.getByText('TypeError')).toBeInTheDocument()
    expect(
      screen.getByText('Cannot read properties of undefined (reading "campaignId")'),
    ).toBeInTheDocument()
  })

  it('renders full stack trace and digest when available', () => {
    const error = Object.assign(new Error('Syntax or query failure at db/campaigns.ts:42'), {
      digest: 'digest_xyz_98765',
    })
    error.stack = 'Error: Syntax failure\n    at CampaignList (src/components/CampaignList.tsx:42:15)'

    render(<DevErrorView error={error} />)

    expect(screen.getByText(/digest_xyz_98765/)).toBeInTheDocument()
    expect(screen.getByText(/at CampaignList \(src\/components\/CampaignList\.tsx:42:15\)/)).toBeInTheDocument()
  })

  it('renders component stack when provided', () => {
    const error = new Error('Render fail')
    const componentStack = '\n    in CampaignTable (at CampaignPage.tsx:20)\n    in DashboardLayout'

    render(<DevErrorView error={error} componentStack={componentStack} />)

    expect(screen.getByText(/Component Hierarchy/i)).toBeInTheDocument()
    expect(screen.getByText(/in CampaignTable/)).toBeInTheDocument()
  })

  it('triggers onReset callback on Try Again click', async () => {
    const resetSpy = vi.fn()
    const user = userEvent.setup()
    render(<DevErrorView error={new Error('Crashed')} onReset={resetSpy} />)

    const retryBtn = screen.getByRole('button', { name: /Try Again/i })
    await user.click(retryBtn)
    expect(resetSpy).toHaveBeenCalledTimes(1)
  })

  it('triggers onTogglePreview callback on Preview Production Page click', async () => {
    const previewSpy = vi.fn()
    const user = userEvent.setup()
    render(<DevErrorView error={new Error('Crashed')} onTogglePreview={previewSpy} />)

    const toggleBtn = screen.getByRole('button', { name: /Preview Production Error Page/i })
    await user.click(toggleBtn)
    expect(previewSpy).toHaveBeenCalledTimes(1)
  })

  it('copies error message and stack trace to clipboard', async () => {
    const user = userEvent.setup()
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

    const error = new Error('Crash for clipboard test')
    error.stack = 'Error: Crash for clipboard test\n    at Object.test'

    render(<DevErrorView error={error} />)

    const copyBtn = screen.getByRole('button', { name: /Copy Error & Stack/i })
    await user.click(copyBtn)

    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('Crash for clipboard test'))
    expect(screen.getByText(/Copied!/i)).toBeInTheDocument()
  })

  it('supports compact rendering when fullPage is false', () => {
    const { container } = render(<DevErrorView error={new Error('Compact error')} fullPage={false} />)
    expect(container.querySelector('.min-vh-100')).toBeNull()
  })
})
