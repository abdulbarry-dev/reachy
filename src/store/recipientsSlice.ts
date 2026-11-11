import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ImportedRecipient } from '../types'

export interface RecipientsState {
  items: ImportedRecipient[]
}

/**
 * Deliberately empty: the slice is a pure state machine.
 *
 * Boot-time hydration happens in `configureStore` (`preloadedState`) and
 * persistence happens in the listener middleware, both from
 * `recipientsStorage`. Importing this module touches no browser API.
 */
const initialState: RecipientsState = {
  items: [],
}

function dedupe(items: ImportedRecipient[]): ImportedRecipient[] {
  const seen = new Set<string>()
  return items.filter((r) => {
    const key = r.email.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const recipientsSlice = createSlice({
  name: 'recipients',
  initialState,
  reducers: {
    setRecipients(state, action: PayloadAction<ImportedRecipient[]>) {
      state.items = dedupe(action.payload)
    },
    addRecipients(state, action: PayloadAction<ImportedRecipient[]>) {
      state.items = dedupe([...state.items, ...action.payload])
    },
    addRecipient(state, action: PayloadAction<Omit<ImportedRecipient, 'id'>>) {
      const normalized = { ...action.payload, email: action.payload.email.toLowerCase().trim() }
      if (state.items.some((r) => r.email === normalized.email)) return
      state.items.push(normalized)
    },
    removeRecipients(state, action: PayloadAction<string[]>) {
      const emails = new Set(action.payload.map((e) => e.toLowerCase()))
      state.items = state.items.filter((r) => !emails.has(r.email.toLowerCase()))
    },
    clearRecipients(state) {
      state.items = []
    },
    updateRecipient(state, action: PayloadAction<{ email: string; data: Partial<ImportedRecipient> }>) {
      const { email, data } = action.payload
      const idx = state.items.findIndex((r) => r.email.toLowerCase() === email.toLowerCase())
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...data }
      }
    },
  },
})

export const { setRecipients, addRecipients, addRecipient, removeRecipients, clearRecipients, updateRecipient } =
  recipientsSlice.actions

export default recipientsSlice.reducer
