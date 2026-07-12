import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ImportedRecipient } from '../types'

const STORAGE_KEY = 'reachy_recipients_v1'

function loadRecipients(): ImportedRecipient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ImportedRecipient[]) : []
  } catch {
    return []
  }
}

function saveRecipients(items: ImportedRecipient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

interface RecipientsState {
  items: ImportedRecipient[]
}

const initialState: RecipientsState = {
  items: loadRecipients(),
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
      saveRecipients(state.items)
    },
    addRecipients(state, action: PayloadAction<ImportedRecipient[]>) {
      state.items = dedupe([...state.items, ...action.payload])
      saveRecipients(state.items)
    },
    addRecipient(state, action: PayloadAction<Omit<ImportedRecipient, 'id'>>) {
      const normalized = { ...action.payload, email: action.payload.email.toLowerCase().trim() }
      if (state.items.some((r) => r.email === normalized.email)) return
      state.items.push(normalized)
      saveRecipients(state.items)
    },
    removeRecipients(state, action: PayloadAction<string[]>) {
      const emails = new Set(action.payload.map((e) => e.toLowerCase()))
      state.items = state.items.filter((r) => !emails.has(r.email.toLowerCase()))
      saveRecipients(state.items)
    },
    clearRecipients(state) {
      state.items = []
      saveRecipients(state.items)
    },
    updateRecipient(state, action: PayloadAction<{ email: string; data: Partial<ImportedRecipient> }>) {
      const { email, data } = action.payload
      const idx = state.items.findIndex((r) => r.email.toLowerCase() === email.toLowerCase())
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...data }
        saveRecipients(state.items)
      }
    },
  },
})

export const { setRecipients, addRecipients, addRecipient, removeRecipients, clearRecipients, updateRecipient } =
  recipientsSlice.actions

export default recipientsSlice.reducer
