import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorView } from './ErrorView'
import { DevErrorView } from './DevErrorView'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Defaults to `window.location.reload`; injectable for tests. */
  onReload?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
  info: ErrorInfo | null
  showProductionPreview: boolean
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
  state: ErrorBoundaryState = {
    error: null,
    info: null,
    showProductionPreview: false,
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled render error', error, info.componentStack)
    }
    this.setState({ info })
  }

  private handleRetry = () => {
    const { error } = this.state
    if (!error) return
    if (isChunkLoadError(error)) {
      ;(this.props.onReload ?? (() => window.location.reload()))()
      return
    }
    this.setState({ error: null, info: null, showProductionPreview: false })
  }

  render() {
    const { error, info, showProductionPreview } = this.state
    if (!error) return this.props.children

    const isDev = process.env.NODE_ENV === 'development'
    const chunkFailure = isChunkLoadError(error)

    if (isDev && !showProductionPreview) {
      return (
        <DevErrorView
          error={error}
          componentStack={info?.componentStack}
          onReset={this.handleRetry}
          onTogglePreview={() => this.setState({ showProductionPreview: true })}
          fullPage={false}
        />
      )
    }

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
        onToggleDevView={isDev ? () => this.setState({ showProductionPreview: false }) : undefined}
      />
    )
  }
}
