import type { Metadata } from 'next'
import { ErrorView } from '../components/ErrorView'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return <ErrorView statusCode={404} />
}
