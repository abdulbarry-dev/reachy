import type { Metadata } from 'next'
import { Recipients } from '../../../views/Recipients'

export const metadata: Metadata = {
  title: 'Recipients',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RecipientsPage() {
  return <Recipients />
}
