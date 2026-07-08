import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SmtpConfig } from '../types'

const STORAGE_KEY = 'reachy_settings_v1'

const defaults: SmtpConfig = {
  host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
  port: Number(import.meta.env.VITE_SMTP_PORT) || 587,
  secure: import.meta.env.VITE_SMTP_SECURE === 'true',
  user: import.meta.env.VITE_SMTP_USER || '',
  pass: import.meta.env.VITE_SMTP_PASS || '',
  fromEmail: import.meta.env.VITE_FROM_EMAIL || '',
  fromName: import.meta.env.VITE_FROM_NAME || 'Reachy',
}

function loadSettings(): SmtpConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...(JSON.parse(raw) as SmtpConfig) } : defaults
  } catch {
    return defaults
  }
}

function saveSettings(settings: SmtpConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

interface SettingsState {
  smtp: SmtpConfig
  delayMs: number
}

const initialState: SettingsState = {
  smtp: loadSettings(),
  delayMs: 1000,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSmtp(state, action: PayloadAction<Partial<SmtpConfig>>) {
      state.smtp = { ...state.smtp, ...action.payload }
      saveSettings(state.smtp)
    },
    updateDelay(state, action: PayloadAction<number>) {
      state.delayMs = action.payload
    },
    resetSettings(state) {
      state.smtp = defaults
      state.delayMs = 1000
      saveSettings(state.smtp)
    },
  },
})

export const { updateSmtp, updateDelay, resetSettings } = settingsSlice.actions

export default settingsSlice.reducer
