import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'var(--color-bg, #f8fafc)',
      }}
    >
      <h1
        style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: 'var(--color-slate-900, #0f172a)',
          marginBottom: '1rem',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: 'var(--color-slate-600, #475569)',
          maxWidth: '480px',
          marginBottom: '2rem',
        }}
      >
        We could not find the page you were looking for.
      </p>
      <Link
        href="/"
        className="btn btn-primary"
        style={{
          padding: '0.625rem 1.5rem',
          borderRadius: 'var(--radius-md, 12px)',
          fontWeight: 600,
        }}
      >
        Return to Home
      </Link>
    </div>
  )
}
