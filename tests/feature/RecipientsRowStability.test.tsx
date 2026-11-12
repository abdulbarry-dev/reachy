import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Recipients } from '../../src/views/Recipients'
import { store } from '../../src/store'
import { addRecipients, setRecipients } from '../../src/store/recipientsSlice'
import { ToastProvider } from '../../src/components/ToastProvider'
import type { ImportedRecipient } from '../../src/types'

/** How many times each row rendered, keyed by email. */
const renders = new Map<string, number>()

// The leaf row is memoised, so it only re-renders when one of its props changes
// identity. Replacing it with an instrumented memo component therefore measures
// exactly the prop stability the page is responsible for.
vi.mock('../../src/components/RecipientRow', async () => {
  const { memo } = await import('react')
  return {
    RecipientRow: memo(function SpyRecipientRow({ recipient }: { recipient: ImportedRecipient }) {
      renders.set(recipient.email, (renders.get(recipient.email) ?? 0) + 1)
      return (
        <tr>
          <td>{recipient.email}</td>
        </tr>
      )
    }),
  }
})

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
  renders.clear()
  store.dispatch(setRecipients([]))
})

describe('Recipients row prop stability', () => {
  it('does not re-render existing rows when the list grows', () => {
    store.dispatch(
      setRecipients([
        { email: 'alice@test.com', name: 'Alice', company: 'Acme' },
        { email: 'bob@test.com', name: 'Bob', company: 'Beta' },
      ]),
    )
    renderRecipients()

    expect(renders.get('alice@test.com')).toBe(1)
    expect(renders.get('bob@test.com')).toBe(1)

    act(() => {
      store.dispatch(addRecipients([{ email: 'carol@test.com', name: 'Carol' }]))
    })

    expect(renders.get('alice@test.com')).toBe(1)
    expect(renders.get('bob@test.com')).toBe(1)
    expect(renders.get('carol@test.com')).toBe(1)
  })
})
