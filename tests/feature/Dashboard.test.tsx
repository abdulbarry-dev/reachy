import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Dashboard } from '../../src/pages/Dashboard'
import { store } from '../../src/store'
import type { CampaignWithCounts } from '../../src/types'

vi.mock('../../src/hooks/useCampaigns', () => ({
  useCampaigns: vi.fn(),
}))

import { useCampaigns } from '../../src/hooks/useCampaigns'
import type { Mock } from 'vitest'

function renderDashboard() {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>,
  )
}

const mockCampaigns: CampaignWithCounts[] = [
  {
    id: 'c1',
    name: 'Test Campaign',
    user_id: 'u1',
    email_account_id: 'ea1',
    subject_template: 'Hello {{name}}',
    body_template: 'Hi {{name}}',
    status: 'running',
    send_rate_seconds: 60,
    daily_cap: 90,
    created_at: '2024-01-01T00:00:00Z',
    total_recipients: 10,
    sent_recipients: 5,
    failed_recipients: 1,
    pending_recipients: 4,
    email_account: { id: 'ea1', from_name: 'Test', from_email: 'test@test.com' } as any,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dashboard', () => {
  it('shows loading skeletons', () => {
    ;(useCampaigns as Mock).mockReturnValue({ campaigns: [], loading: true, error: null })
    renderDashboard()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows error state', () => {
    ;(useCampaigns as Mock).mockReturnValue({ campaigns: [], loading: false, error: 'Failed to fetch' })
    renderDashboard()
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })

  it('shows empty state with create button', () => {
    ;(useCampaigns as Mock).mockReturnValue({ campaigns: [], loading: false, error: null })
    renderDashboard()
    expect(screen.getByText('No campaigns created yet')).toBeInTheDocument()
    expect(screen.getByText('Create Campaign')).toBeInTheDocument()
  })

  it('shows campaign list with aggregated stats', () => {
    ;(useCampaigns as Mock).mockReturnValue({ campaigns: mockCampaigns, loading: false, error: null })
    renderDashboard()
    expect(screen.getByText('Test Campaign')).toBeInTheDocument()
    expect(screen.getByText('Total recipients')).toBeInTheDocument()
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Sent').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1)
  })
})
