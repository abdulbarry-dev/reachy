import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import {
  addRecipient,
  addRecipients,
  clearRecipients,
  removeRecipients,
  setRecipients,
  updateRecipient,
  type RecipientsState,
} from './recipientsSlice'
import { saveRecipients } from './recipientsStorage'

/** Every action that changes the recipient list. */
const RECIPIENT_MUTATIONS = isAnyOf(
  setRecipients,
  addRecipients,
  addRecipient,
  removeRecipients,
  clearRecipients,
  updateRecipient,
)

interface WithRecipients {
  recipients: RecipientsState
}

/**
 * Persists the recipient list after any action that changes it.
 *
 * This used to live inside the reducers, which made them impure: time-travel
 * replays rewrote storage, and a quota error thrown by `localStorage.setItem`
 * escaped mid-dispatch. A listener observes the settled state instead, so
 * reducers stay pure and a storage failure cannot corrupt a state transition.
 *
 * A factory rather than a singleton so tests can attach an independent
 * listener to their own store.
 */
export function createRecipientsPersistence<State extends WithRecipients = WithRecipients>() {
  const listener = createListenerMiddleware<State>()

  listener.startListening({
    matcher: RECIPIENT_MUTATIONS,
    effect: (_action, api) => {
      saveRecipients(api.getState().recipients.items)
    },
  })

  return listener
}
