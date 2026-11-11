import { useState } from 'react'
import { Row } from 'react-bootstrap'
import { PageHeader } from '../components/PageHeader'
import { AnimatedPage } from '../components/AnimatedPage'
import { useEmailAccounts } from '../hooks/useEmailAccounts'
import { useToast } from '../hooks/useToast'
import { ConfirmModal } from '../components/ConfirmModal'
import { ConnectAccountForm } from './settings/ConnectAccountForm'
import { ConnectedAccountsCard } from './settings/ConnectedAccountsCard'

export function Settings() {
  const { accounts, loading: accountsLoading, refetch, deleteAccount } = useEmailAccounts()
  const { toast } = useToast()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleConnected = () => {
    toast('Email account connected successfully', 'success')
    refetch()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { ok, error } = await deleteAccount(deleteTarget)
    setDeleteTarget(null)
    if (ok) {
      toast('Email account removed', 'success')
    } else {
      toast(error ?? 'Failed to remove account', 'error')
    }
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Settings"
        description="Connect and manage your Gmail sender accounts."
        actions={
          !accountsLoading && accounts.length > 0 && (
            <span className="count-badge d-inline-flex align-items-center gap-1.5">
              <i className="bi bi-envelope-fill"></i>
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </span>
          )
        }
      />

      <div>
        <Row className="g-4">
          <ConnectAccountForm onConnected={handleConnected} />
          <ConnectedAccountsCard
            accounts={accounts}
            loading={accountsLoading}
            onDelete={setDeleteTarget}
          />
        </Row>
      </div>

      <ConfirmModal
        show={!!deleteTarget}
        title="Remove email account"
        message="Are you sure you want to remove this email account? Campaigns using it will fail to send."
        confirmLabel="Remove"
        icon="bi-trash"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AnimatedPage>
  )
}
