import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, ToastContext } from '../../src/components/ToastProvider'
import { useContext } from 'react'

function TestButton() {
  const { toast } = useContext(ToastContext)!
  return <button onClick={() => toast('Hello world', 'success')}>Show toast</button>
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
})
