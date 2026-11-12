/**
 * Shared motion for the three auth screens.
 *
 * `easeOut` is the expo-out bezier the rest of the app uses; the auth card and
 * its side panel both settle on it so the two halves feel like one surface.
 */
export const easeOut = [0.16, 1, 0.3, 1] as const

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
  exit:   { opacity: 0, y: -12, transition: { duration: 0.2 } }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit:   { opacity: 0, transition: { duration: 0.2 } }
}
