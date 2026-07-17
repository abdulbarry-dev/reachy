import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Recipients } from '../../src/pages/Recipients'
import { store } from '../../src/store'
import { setRecipients } from '../../src/store/recipientsSlice'
import { ToastProvider } from '../../src/components/ToastProvider'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

function renderRecipients() {
  return render(
    <Provider store={store}>
      <ToastProvider>
        <Recipients />
      </ToastProvider>
    </Provider>,
  )
}

beforeEach(() => {
  store.dispatch(setRecipients([]))
})

describe('Recipients', () => {
  it('shows empty state by default', () => {
    renderRecipients()
    expect(screen.getByText('Recipients')).toBeInTheDocument()
    expect(screen.getByText('Import from file')).toBeInTheDocument()
  })

  it('shows imported recipients from the store', () => {
    store.dispatch(setRecipients([
      { email: 'alice@test.com', name: 'Alice', company: 'Acme' },
      { email: 'bob@test.com', name: 'Bob', company: 'Beta' },
    ]))
    renderRecipients()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('bob@test.com')).toBeInTheDocument()
  })

  it('shows export and download template buttons', () => {
    renderRecipients()
    expect(screen.getByText('Need a template?')).toBeInTheDocument()
  })
})
