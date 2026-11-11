import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlaygroundSection } from '../../src/pages/landing/sections/PlaygroundSection'

/**
 * Inserting a merge variable must leave the caret directly after the inserted
 * token, so the next thing the visitor types continues the sentence.
 *
 * The first implementation deferred that with `setTimeout(…, 50)`, which made
 * the caret settle in a second visible jump. The contract is that the caret is
 * already correct when the click returns.
 */

describe('PlaygroundSection merge variables', () => {
  it('inserts at the caret and leaves the caret after the token', () => {
    render(<PlaygroundSection />)

    const textarea = screen.getByLabelText(/Compose Email Content/i) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    textarea.setSelectionRange(0, 0)

    fireEvent.click(screen.getByRole('button', { name: 'company' }))

    expect(textarea.value).toBe('{{company}}Hello world')
    expect(textarea.selectionStart).toBe('{{company}}'.length)
    expect(textarea.selectionEnd).toBe('{{company}}'.length)
  })

  it('replaces the selected text instead of appending', () => {
    render(<PlaygroundSection />)

    const textarea = screen.getByLabelText(/Compose Email Content/i) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    textarea.setSelectionRange(6, 11)

    fireEvent.click(screen.getByRole('button', { name: 'product' }))

    expect(textarea.value).toBe('Hello {{product}}')
    expect(textarea.selectionStart).toBe('Hello {{product}}'.length)
  })
})
