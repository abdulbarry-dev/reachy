import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CampaignResult } from '../types'

interface CampaignState {
  subject: string
  body: string
  isSending: boolean
  result: CampaignResult | null
  error: string | null
}

const initialState: CampaignState = {
  subject: '',
  body: '',
  isSending: false,
  result: null,
  error: null,
}

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setSubject(state, action: PayloadAction<string>) {
      state.subject = action.payload
    },
    setBody(state, action: PayloadAction<string>) {
      state.body = action.payload
    },
    sendStart(state) {
      state.isSending = true
      state.error = null
      state.result = null
    },
    sendSuccess(state, action: PayloadAction<CampaignResult>) {
      state.isSending = false
      state.result = action.payload
      state.error = null
    },
    sendFailure(state, action: PayloadAction<string>) {
      state.isSending = false
      state.result = null
      state.error = action.payload
    },
    clearCampaign(state) {
      state.subject = ''
      state.body = ''
      state.result = null
      state.error = null
      state.isSending = false
    },
  },
})

export const { setSubject, setBody, sendStart, sendSuccess, sendFailure, clearCampaign } =
  campaignSlice.actions

export default campaignSlice.reducer
