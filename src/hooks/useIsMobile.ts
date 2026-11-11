import { useCallback, useSyncExternalStore } from 'react'

/** Matches the `md` breakpoint the sidebar layout switches at. */
export const MOBILE_BREAKPOINT = 768

function readIsMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

/** No viewport on the server: assume desktop so the sidebar renders expanded. */
function getServerSnapshot() {
  return false
}

/**
 * Viewport width as an external store, so the value is read on the client only
 * and stays in sync with resize events without an effect.
 *
 * @param onResize Called with the new value after every resize, before the
 * re-render. Lets callers reset state that only makes sense for one viewport
 * (such as an open mobile drawer) without an effect.
 */
export function useIsMobile(onResize?: (isMobile: boolean) => void) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handleResize = () => {
        onChange()
        onResize?.(readIsMobile())
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    },
    [onResize],
  )

  return useSyncExternalStore(subscribe, readIsMobile, getServerSnapshot)
}
