import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorView } from './ErrorView'

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
    // Keep stack strictly in dev console, never in DOM or user-facing state
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled render error', error, info.componentStack)
    }
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
      <ErrorView
        statusCode={chunkFailure ? 419 : 500}
        error={error}
        title="Something went wrong"
        message={
          chunkFailure
            ? 'This part of the app could not be downloaded. Reloading usually fixes it.'
            : 'The page hit an unexpected error. You can try again without losing your session.'
        }
        primaryCtaLabel={chunkFailure ? 'Reload page' : 'Try again'}
        onReset={this.handleRetry}
        fullPage={false}
      />
    )
  }
}
