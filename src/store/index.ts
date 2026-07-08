import { configureStore } from '@reduxjs/toolkit'
import recipientsReducer from './recipientsSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipients: recipientsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
