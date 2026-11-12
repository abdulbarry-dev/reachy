'use client'

import { useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { addRecipients } from '../store/recipientsSlice'
import { PageHeader } from '../components/PageHeader'
import { AnimatedPage } from '../components/AnimatedPage'
import { useEmailAccounts } from '../hooks/useEmailAccounts'
import { useToast } from '../hooks/useToast'
import { invokeEdgeFunction } from '../lib/edge-functions'
import { useCampaignDraft } from './compose/useCampaignDraft'
import { CampaignDetailsForm } from './compose/CampaignDetailsForm'
import { ScratchpadCard } from './compose/ScratchpadCard'
import { LivePreviewCard } from './compose/LivePreviewCard'
import type { RootState, AppDispatch } from '../store'
import type { ImportedRecipient } from '../types'

export function Compose() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const importedRecipients = useSelector((state: RootState) => state.recipients.items)
  const { accounts, loading: accountsLoading } = useEmailAccounts()
  const { toast } = useToast()

  const draft = useCampaignDraft()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = (parsed: ImportedRecipient[]) => {
    dispatch(addRecipients(parsed))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.emailAccountId) {
      setError('Select an email account first.')
      return
    }
    if (!draft.campaignName.trim()) {
      setError('Enter a campaign name.')
      return
    }
    if (!draft.subject.trim()) {
      setError('Enter a subject template.')
      return
    }
    if (!draft.body.trim()) {
      setError('Enter a body template.')
      return
    }
    if (importedRecipients.length === 0) {
      setError('Add at least one recipient.')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const data = await invokeEdgeFunction<{ campaignId: string }>(
        'create-campaign',
        {
          emailAccountId: draft.emailAccountId,
          name: draft.campaignName.trim(),
          subjectTemplate: draft.subject.trim(),
          bodyTemplate: draft.body.trim(),
          recipients: importedRecipients,
          sendRateSeconds: draft.sendRate,
          dailyCap: draft.dailyCap,
        },
        'Failed to create campaign',
      )

      toast('Campaign created successfully', 'success')
      router.push(`/campaigns/${data.campaignId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="New campaign"
        description="Write once, personalize for every recipient."
        descriptionClassName="page-header-desc"
        actions={
          importedRecipients.length > 0 && (
            <span className="count-badge d-inline-flex align-items-center gap-1.5">
              <i className="bi bi-people-fill"></i>
              {importedRecipients.length} recipients ready
            </span>
          )
        }
      />

      <div>
        <Row className="g-4">
          <Col lg={7} className="min-w-0">
            <CampaignDetailsForm
              draft={draft}
              accounts={accounts}
              accountsLoading={accountsLoading}
              creating={creating}
              error={error}
              onSubmit={handleCreate}
            />
            <ScratchpadCard count={importedRecipients.length} onUpload={handleUpload} />
          </Col>

          <Col lg={5} className="min-w-0">
            <LivePreviewCard
              recipients={importedRecipients}
              subject={draft.subject}
              body={draft.body}
            />
          </Col>
        </Row>
      </div>
    </AnimatedPage>
  )
}
