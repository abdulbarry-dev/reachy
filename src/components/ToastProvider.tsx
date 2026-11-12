import { createContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

export type ToastType = 'success' | 'error' | 'info'

export interface ToastOptions {
  duration?: number
}

export interface ToastItemData {
  id: number
  message: string
  type: ToastType
  duration: number
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextToastId = 0

interface ToastItemProps {
  toast: ToastItemData
  onRemove: (id: number) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const isDismissingRef = useRef(false)

  const handleDismiss = useCallback(() => {
    if (isDismissingRef.current) return
    isDismissingRef.current = true

    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    const el = itemRef.current
    if (!el) {
      onRemove(toast.id)
      return
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (prefersReduced) {
      onRemove(toast.id)
      return
    }

    gsap.to(el, {
      opacity: 0,
      x: 36,
      scale: 0.94,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(el, {
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: 0,
          marginBottom: 0,
          duration: 0.16,
          ease: 'power2.out',
          onComplete: () => onRemove(toast.id),
        })
      },
    })
  }, [toast.id, onRemove])

  useGSAP(
    () => {
      const el = itemRef.current
      const iconEl = iconRef.current
      const progEl = progressRef.current
      if (!el) return

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

      const tl = gsap.timeline({
        onComplete: () => {
          handleDismiss()
        },
      })
      timelineRef.current = tl

      if (!prefersReduced) {
        tl.fromTo(
          el,
          { y: -24, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.36, ease: 'back.out(1.4)' },
        )

        if (iconEl) {
          tl.fromTo(
            iconEl,
            { scale: 0.4, rotation: -25 },
            { scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(2)' },
            '<0.05',
          )
        }

        if (progEl) {
          tl.to(
            progEl,
            {
              scaleX: 0,
              transformOrigin: 'left center',
              duration: Math.max(0.5, (toast.duration - 360) / 1000),
              ease: 'none',
            },
            '>-0.05',
          )
        }
      } else {
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 })
        if (progEl) {
          tl.to(progEl, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: Math.max(0.5, (toast.duration - 150) / 1000),
            ease: 'none',
          })
        }
      }

      return () => {
        tl.kill()
      }
    },
    { scope: itemRef },
  )

  const handleMouseEnter = () => {
    if (!isDismissingRef.current && timelineRef.current) {
      timelineRef.current.pause()
    }
  }

  const handleMouseLeave = () => {
    if (!isDismissingRef.current && timelineRef.current) {
      timelineRef.current.resume()
    }
  }

  const iconClassMap: Record<ToastType, string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill',
  }

  return (
    <div
      ref={itemRef}
      role="alert"
      className={`toast-reachy toast-reachy-${toast.type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span ref={iconRef} className="toast-reachy-icon-box" aria-hidden="true">
        <i className={`bi ${iconClassMap[toast.type]}`} />
      </span>
      <span className="toast-reachy-message">{toast.message}</span>
      <button
        type="button"
        className="toast-reachy-close"
        onClick={handleDismiss}
        aria-label="Close notification"
      >
        <i className="bi bi-x" aria-hidden="true" />
      </button>
      <div ref={progressRef} className="toast-reachy-progress-bar" aria-hidden="true" />
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', options?: ToastOptions) => {
      const id = nextToastId++
      const duration = options?.duration ?? 3500
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    [],
  )

  // One object for the lifetime of the provider: consumers of `useToast` only
  // re-render when the toast function itself changes, which it never does.
  const contextValue = useMemo<ToastContextValue>(() => ({ toast: addToast }), [addToast])

  // Dev-only console hook for poking toasts by hand; stripped from production.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const w = window as unknown as { __reachyToast?: typeof addToast }
    w.__reachyToast = addToast
    return () => {
      if (w.__reachyToast === addToast) delete w.__reachyToast
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="toast-reachy-container"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
export { ToastContext }
