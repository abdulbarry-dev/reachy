import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, ToastContext, type ToastContextValue } from '../../src/components/ToastProvider'
import { useContext } from 'react'

function TestButton() {
  const { toast } = useContext(ToastContext)!
  return <button onClick={() => toast('Hello world', 'success')}>Show toast</button>
}

const seenValues: ToastContextValue[] = []

function ContextProbe() {
  seenValues.push(useContext(ToastContext)!)
  return null
}

describe('ToastProvider', () => {
  it('renders children', () => {
    render(<ToastProvider><p>child</p></ToastProvider>)
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('shows a toast on button click', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestButton />
      </ToastProvider>,
    )

    await user.click(screen.getByText('Show toast'))
    expect(screen.getByRole('alert')).toHaveTextContent('Hello world')
  })

  it('renders multiple toasts', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestButton />
      </ToastProvider>,
    )

    await user.click(screen.getByText('Show toast'))
    await user.click(screen.getByText('Show toast'))
    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })

  it('keeps the context value stable when a toast is added', async () => {
    seenValues.length = 0
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <TestButton />
        <ContextProbe />
      </ToastProvider>,
    )

    expect(seenValues).toHaveLength(1)

    await user.click(screen.getByText('Show toast'))

    // Adding a toast re-renders the provider. The context value must not change
    // identity, otherwise every consumer in the app re-renders too.
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(seenValues).toHaveLength(1)
  })
})
