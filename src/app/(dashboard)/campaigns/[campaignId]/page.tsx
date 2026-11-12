import type { Metadata } from 'next'
import { CampaignDetail } from '../../../../views/CampaignDetail'

export const metadata: Metadata = {
  title: 'Campaign Details',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CampaignDetailPage() {
  return <CampaignDetail />
}
