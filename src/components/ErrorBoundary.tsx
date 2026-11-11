import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Defaults to `window.location.reload`; injectable for tests. */
  onReload?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * A lazy chunk that failed to download cannot be retried by re-rendering: the
 * import promise is already rejected for this document. Those failures get a
 * reload button, everything else gets a plain retry.
 */
function isChunkLoadError(error: Error) {
  return (
    error.name === 'ChunkLoadError' ||
    /dynamically imported module|Loading chunk .* failed|Importing a module script failed/i.test(
      error.message,
    )
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the stack in the console for development and for error reporting.
    console.error('Unhandled render error', error, info.componentStack)
  }

  private handleRetry = () => {
    const { error } = this.state
    if (!error) return
    if (isChunkLoadError(error)) {
      ;(this.props.onReload ?? (() => window.location.reload()))()
      return
    }
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const chunkFailure = isChunkLoadError(error)

    return (
      <div className="d-flex align-items-center justify-content-center p-4" style={{ minHeight: 320 }}>
        <div className="card-reachy border-0 p-4 p-sm-5 text-center" role="alert">
          <div className="empty-state-icon mb-3">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          </div>
          <h2 className="page-title h4 mb-2">Something went wrong</h2>
          <p className="text-muted small mb-4">
            {chunkFailure
              ? 'This part of the app could not be downloaded. Reloading usually fixes it.'
              : 'The page hit an unexpected error. You can try again without losing your session.'}
          </p>
          <button
            type="button"
            className="btn-reachy-outline btn-reachy-sm gap-1"
            onClick={this.handleRetry}
          >
            <i className={`bi ${chunkFailure ? 'bi-arrow-clockwise' : 'bi-arrow-repeat'}`} aria-hidden="true" />
            <span>{chunkFailure ? 'Reload page' : 'Try again'}</span>
          </button>
        </div>
      </div>
    )
  }
}
