import { useState } from 'react'

export interface CampaignDraft {
  emailAccountId: string
  campaignName: string
  subject: string
  body: string
  sendRate: number
  dailyCap: number
  setEmailAccountId: (value: string) => void
  setCampaignName: (value: string) => void
  setSubject: (value: string) => void
  setBody: (value: string) => void
  setSendRate: (value: number) => void
  setDailyCap: (value: number) => void
}

/**
 * The campaign fields as the user types them.
 *
 * They are shared by the details form and the live preview, so they are one
 * object rather than twelve props threaded through the page. Clamping stays in
 * the form, next to the inputs that produce the raw numbers.
 */
export function useCampaignDraft(): CampaignDraft {
  const [emailAccountId, setEmailAccountId] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sendRate, setSendRate] = useState(60)
  const [dailyCap, setDailyCap] = useState(90)

  return {
    emailAccountId,
    campaignName,
    subject,
    body,
    sendRate,
    dailyCap,
    setEmailAccountId,
    setCampaignName,
    setSubject,
    setBody,
    setSendRate,
    setDailyCap,
  }
}
