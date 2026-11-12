export type AuthMode = 'login' | 'signup' | 'reset-password'

export interface PanelCopy {
  tag: string
  headline: string
  sub: string
  altText: string
  altLink: string
  altLabel: string
}

/** The copy for the marketing half of each auth screen. */
export const panelConfig: Record<AuthMode, PanelCopy> = {
  login: {
    tag: 'Welcome back',
    headline: 'Sign in to manage your campaigns',
    sub: 'Monitor deliverability, track dispatch status, and keep your outreach on schedule.',
    altText: "Don't have an account?",
    altLink: '/signup',
    altLabel: 'Create one',
  },
  signup: {
    tag: 'Get started',
    headline: 'Cold outreach, automated',
    sub: 'Connect Gmail, upload your list, and let pg_cron handle cadenced dispatch — all from one dashboard.',
    altText: 'Already have an account?',
    altLink: '/login',
    altLabel: 'Sign in',
  },
  'reset-password': {
    tag: 'Account recovery',
    headline: 'Reset your password',
    sub: "Enter the email linked to your account and we'll send a secure reset link.",
    altText: 'Remember your password?',
    altLink: '/login',
    altLabel: 'Sign in',
  },
}
