import { configureStore } from '@reduxjs/toolkit'
import recipientsReducer from './recipientsSlice'
import authReducer from './authSlice'
import { createRecipientsPersistence } from './recipientsPersistence'
import { loadRecipients } from './recipientsStorage'

/** The full store shape, named before the store so the middleware can use it. */
export type AppState = {
  auth: ReturnType<typeof authReducer>
  recipients: ReturnType<typeof recipientsReducer>
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recipients: recipientsReducer,
  },
  // Hydrate once from storage; the slice itself stays pure.
  preloadedState: {
    recipients: { items: loadRecipients() },
  },
  // Persist after any recipient mutation; reducers never touch storage.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(createRecipientsPersistence<AppState>().middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
