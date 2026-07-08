import { configureStore } from '@reduxjs/toolkit'
import recipientsReducer from './recipientsSlice'
import campaignReducer from './campaignSlice'
import settingsReducer from './settingsSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipients: recipientsReducer,
    campaign: campaignReducer,
    settings: settingsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
