import type { Metadata } from 'next'
import { Compose } from '../../../views/Compose'

export const metadata: Metadata = {
  title: 'Compose Campaign',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ComposePage() {
  return <Compose />
}
