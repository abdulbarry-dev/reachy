import { useState, useCallback } from 'react'
import { Alert, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { addRecipient, addRecipients, clearRecipients, removeRecipients, updateRecipient } from '../store/recipientsSlice'
import { PageHeader } from '../components/PageHeader'
import { AnimatedPage } from '../components/AnimatedPage'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast } from '../hooks/useToast'
import { recipientsToCsv } from '../utils/fileParsers'
import { generateTemplate } from '../utils/templateGenerator'
import { downloadBlob, downloadText } from '../utils/download'
import { ImportFromFileCard } from './recipients/ImportFromFileCard'
import { AddRecipientCard } from './recipients/AddRecipientCard'
import { RecipientsTableCard } from './recipients/RecipientsTableCard'
import { EditRecipientModal } from './recipients/EditRecipientModal'
import type { RootState, AppDispatch } from '../store'
import type { ImportedRecipient } from '../types'

export function Recipients() {
  const dispatch = useDispatch<AppDispatch>()
  const recipients = useSelector((state: RootState) => state.recipients.items)
  const { toast } = useToast()

  const [addedCount, setAddedCount] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [bulkDelete, setBulkDelete] = useState(false)
  const [clearAll, setClearAll] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const editingRecipient = editTarget ? recipients.find((r) => r.email.toLowerCase() === editTarget.toLowerCase()) : undefined
  const deletingRecipient = deleteTarget ? recipients.find((r) => r.email.toLowerCase() === deleteTarget.toLowerCase()) : undefined

  const handleUpload = (parsed: ImportedRecipient[]) => {
    dispatch(addRecipients(parsed))
    setAddedCount(parsed.length)
  }

  const handleManualAdd = useCallback(
    (recipient: Omit<ImportedRecipient, 'id'>) => dispatch(addRecipient(recipient)),
    [dispatch],
  )

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === recipients.length) return new Set<string>()
      return new Set(recipients.map((r) => r.email))
    })
  }, [recipients])

  const toggleOne = useCallback((recipient: ImportedRecipient) => {
    const email = recipient.email
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }, [])

  const openEdit = useCallback((recipient: ImportedRecipient) => {
    setEditTarget(recipient.email)
    setEditName(recipient.name ?? '')
    setEditCompany(recipient.company ?? '')
  }, [])

  const requestDelete = useCallback((recipient: ImportedRecipient) => {
    setDeleteTarget(recipient.email)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editTarget !== null) {
      dispatch(updateRecipient({ email: editTarget, data: { name: editName.trim() || undefined, company: editCompany.trim() || undefined } }))
      setEditTarget(null)
      toast('Recipient updated', 'success')
    }
  }, [dispatch, editTarget, editName, editCompany, toast])

  const handleDeleteSingle = useCallback(() => {
    if (deleteTarget !== null) {
      const removed = recipients.find((r) => r.email.toLowerCase() === deleteTarget.toLowerCase())
      dispatch(removeRecipients([deleteTarget]))
      setDeleteTarget(null)
      if (removed) toast(`Removed ${removed.email}`, 'success')
    }
  }, [deleteTarget, dispatch, recipients, toast])

  const handleBulkDelete = useCallback(() => {
    const count = selected.size
    dispatch(removeRecipients(Array.from(selected)))
    setSelected(new Set())
    setBulkDelete(false)
    toast(`${count} ${count === 1 ? 'recipient' : 'recipients'} removed`, 'success')
  }, [selected, dispatch, toast])

  const handleClearAll = useCallback(() => {
    const count = recipients.length
    dispatch(clearRecipients())
    setSelected(new Set())
    setClearAll(false)
    toast(`All ${count} recipients cleared`, 'success')
  }, [recipients.length, dispatch, toast])

  const exportAllJson = useCallback(() => downloadText('recipients.json', JSON.stringify(recipients, null, 2), 'application/json'), [recipients])

  const exportAllCsv = useCallback(() => downloadText('recipients.csv', recipientsToCsv(recipients), 'text/csv'), [recipients])

  const exportSingleJson = useCallback((recipient: ImportedRecipient) =>
    downloadText(`recipient-${recipient.email}.json`, JSON.stringify([recipient], null, 2), 'application/json'), [])

  const exportSingleCsv = useCallback((recipient: ImportedRecipient) =>
    downloadText(`recipient-${recipient.email}.csv`, recipientsToCsv([recipient]), 'text/csv'), [])

  const handleDownloadTemplate = useCallback(async (format: 'csv' | 'xlsx') => {
    setDownloading(true)
    try {
      const blob = await generateTemplate(recipients, format)
      downloadBlob(`recipients-template.${format}`, blob)
    } catch {
      toast('Failed to generate template. Please try again.', 'error')
    } finally {
      setDownloading(false)
    }
  }, [recipients, toast])

  return (
    <AnimatedPage>
      <PageHeader
        title="Recipients"
        description="Import contacts from files. These will be available when you create a campaign."
        descriptionClassName="page-header-desc"
        actions={
          recipients.length > 0 && (
            <span className="count-badge d-inline-flex align-items-center gap-1.5">
              <i className="bi bi-people-fill"></i>
              {recipients.length} total
            </span>
          )
        }
      />

      {addedCount > 0 && (
        <div className="mb-4">
          <Alert variant="success" dismissible onClose={() => setAddedCount(0)} className="border-0 rounded-3 d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill"></i>
            <span>Added {addedCount} recipient{addedCount === 1 ? '' : 's'} from file.</span>
          </Alert>
        </div>
      )}

      <div>
        <Row className="g-4 mb-4">
          <ImportFromFileCard
            onUpload={handleUpload}
            onDownloadTemplate={handleDownloadTemplate}
            downloading={downloading}
          />
          <AddRecipientCard onAdd={handleManualAdd} />
        </Row>
      </div>

      <RecipientsTableCard
        recipients={recipients}
        selected={selected}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onEdit={openEdit}
        onDelete={requestDelete}
        onExportJson={exportSingleJson}
        onExportCsv={exportSingleCsv}
        onExportAllJson={exportAllJson}
        onExportAllCsv={exportAllCsv}
        onRequestBulkDelete={() => setBulkDelete(true)}
        onRequestClearAll={() => setClearAll(true)}
      />

      <EditRecipientModal
        show={editTarget !== null}
        email={editingRecipient?.email ?? ''}
        name={editName}
        company={editCompany}
        onNameChange={setEditName}
        onCompanyChange={setEditCompany}
        onSave={handleSaveEdit}
        onCancel={() => setEditTarget(null)}
      />

      {/* Single delete confirmation */}
      <ConfirmModal
        show={deleteTarget !== null}
        title="Delete recipient"
        message={deletingRecipient ? `Remove "${deletingRecipient.email}" from your list? This cannot be undone.` : ''}
        confirmLabel="Delete"
        icon="bi-trash"
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete confirmation */}
      <ConfirmModal
        show={bulkDelete}
        title="Delete selected recipients"
        message={`Remove ${selected.size} ${selected.size === 1 ? 'recipient' : 'recipients'} from your list? This cannot be undone.`}
        confirmLabel="Delete"
        icon="bi-trash"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDelete(false)}
      />

      {/* Clear all confirmation */}
      <ConfirmModal
        show={clearAll}
        title="Clear all recipients"
        message={`Remove all ${recipients.length} recipients from your list? This cannot be undone.`}
        confirmLabel="Clear all"
        icon="bi-trash3"
        onConfirm={handleClearAll}
        onCancel={() => setClearAll(false)}
      />
    </AnimatedPage>
  )
}
