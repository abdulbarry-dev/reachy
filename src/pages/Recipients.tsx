import { useState, useCallback } from 'react'
import { Alert, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { addRecipient, addRecipients, clearRecipients, removeRecipients, updateRecipient } from '../store/recipientsSlice'
import { AnimatedPage } from '../components/AnimatedPage'
import { ConfirmModal } from '../components/ConfirmModal'
import { FileDropzone } from '../components/FileDropzone'
import { RecipientRow } from '../components/RecipientRow'
import { useToast } from '../hooks/useToast'
import { recipientsToCsv } from '../utils/fileParsers'
import { generateTemplate } from '../utils/templateGenerator'
import type { RootState, AppDispatch } from '../store'
import type { ImportedRecipient } from '../types'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Recipients() {
  const dispatch = useDispatch<AppDispatch>()
  const recipients = useSelector((state: RootState) => state.recipients.items)
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
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

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return

    dispatch(addRecipient({ email: normalized, name: name.trim() || undefined, company: company.trim() || undefined }))
    setEmail('')
    setName('')
    setCompany('')
  }

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === recipients.length) return new Set<string>()
      return new Set(recipients.map((r) => r.email))
    })
  }, [recipients])

  const toggleOne = useCallback((email: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }, [])

  const openEdit = useCallback((email: string) => {
    const recipient = recipients.find((r) => r.email.toLowerCase() === email.toLowerCase())
    if (!recipient) return
    setEditTarget(email)
    setEditName(recipient.name ?? '')
    setEditCompany(recipient.company ?? '')
  }, [recipients])

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

  const exportAllJson = useCallback(() => download('recipients.json', JSON.stringify(recipients, null, 2), 'application/json'), [recipients])

  const exportAllCsv = useCallback(() => download('recipients.csv', recipientsToCsv(recipients), 'text/csv'), [recipients])

  const exportSingleJson = useCallback((i: number) =>
    download(`recipient-${recipients[i].email}.json`, JSON.stringify([recipients[i]], null, 2), 'application/json'), [recipients])

  const exportSingleCsv = useCallback((i: number) =>
    download(`recipient-${recipients[i].email}.csv`, recipientsToCsv([recipients[i]]), 'text/csv'), [recipients])

  const handleDownloadTemplate = useCallback(async (format: 'csv' | 'xlsx') => {
    setDownloading(true)
    try {
      const blob = await generateTemplate(recipients, format)
      const filename = `recipients-template.${format}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Failed to generate template. Please try again.', 'error')
    } finally {
      setDownloading(false)
    }
  }, [recipients, toast])

  return (
    <AnimatedPage>
      {/* Page header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 mb-sm-5">
        <div>
          <h1 className="h2 mb-1 page-title">Recipients</h1>
          <p className="text-muted mb-0 page-header-desc">Import contacts from files. These will be available when you create a campaign.</p>
        </div>
        {recipients.length > 0 && (
          <span className="count-badge d-inline-flex align-items-center gap-1.5">
            <i className="bi bi-people-fill"></i>
            {recipients.length} total
          </span>
        )}
      </div>

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
          <Col lg={7} className="min-w-0">
            <div className="h-100 min-w-0">
              <Card className="card-reachy border-0 h-100">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="section-icon">
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Import from file</h5>
                      <p className="text-muted small mb-0">JSON, CSV, or Excel</p>
                    </div>
                  </div>
                  <FileDropzone onUpload={handleUpload} />
                  <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top">
                    <span className="small text-muted me-1">Need a template?</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1"
                      onClick={() => handleDownloadTemplate('csv')}
                      disabled={downloading}
                    >
                      <i className="bi bi-filetype-csv"></i>
                      CSV
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-file-earmark-excel"></i>
                      )}
                      Excel
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col lg={5} className="min-w-0">
            <div className="h-100 min-w-0">
              <Card className="card-reachy border-0 h-100">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="section-icon">
                      <i className="bi bi-person-plus"></i>
                    </div>
                    <div>
                      <h5 className="section-title mb-0">Add manually</h5>
                      <p className="text-muted small mb-0">One recipient at a time</p>
                    </div>
                  </div>
                  <Form onSubmit={handleManualAdd} className="flex-grow-1 d-flex flex-column">
                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="recip-email">Email address</Form.Label>
                      <Form.Control
                        id="recip-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="contact@company.com"
                        className="form-control-reachy"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="recip-name">Name</Form.Label>
                      <Form.Control
                        id="recip-name"
                        type="text"
                        inputMode="text"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        className="form-control-reachy"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <Form.Label className="form-label-reachy" htmlFor="recip-company">Company</Form.Label>
                      <Form.Control
                        id="recip-company"
                        type="text"
                        inputMode="text"
                        autoComplete="organization"
                        placeholder="Acme Inc."
                        className="form-control-reachy"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-submit-reachy mt-auto">
                      <i className="bi bi-plus-lg"></i>
                      Add recipient
                    </button>
                  </Form>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* Recipients list */}
      <div>
        <Card className="card-reachy border-0">
          <Card.Body className="p-4">
            {/* Toolbar */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <div className="section-icon">
                  <i className="bi bi-list-ul"></i>
                </div>
                <div>
                  <h5 className="section-title mb-0">Recipients list</h5>
                  <p className="text-muted small mb-0">{recipients.length} {recipients.length === 1 ? 'contact' : 'contacts'}</p>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap toolbar-actions">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-pill d-inline-flex align-items-center gap-1"
                  onClick={exportAllJson}
                  disabled={recipients.length === 0}
                >
                  <i className="bi bi-download"></i>
                  JSON
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-pill d-inline-flex align-items-center gap-1"
                  onClick={exportAllCsv}
                  disabled={recipients.length === 0}
                >
                  <i className="bi bi-filetype-csv"></i>
                  CSV
                </Button>
                {selected.size > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill d-inline-flex align-items-center gap-1"
                    onClick={() => setBulkDelete(true)}
                  >
                    <i className="bi bi-trash"></i>
                    Delete ({selected.size})
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="rounded-pill d-inline-flex align-items-center gap-1"
                  onClick={() => setClearAll(true)}
                  disabled={recipients.length === 0}
                >
                  <i className="bi bi-trash3"></i>
                  Clear all
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <Table hover className="table-reachy mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <Form.Check
                        checked={recipients.length > 0 && selected.size === recipients.length}
                        onChange={toggleAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th>Email</th>
                    <th className="col-name">Name</th>
                    <th className="col-company">Company</th>
                    <th style={{ width: 48 }} className="text-end pe-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <RecipientRow
                      key={`${r.email}-${i}`}
                      recipient={r}
                      index={i}
                      selected={selected.has(r.email)}
                      onToggle={toggleOne}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onExportJson={exportSingleJson}
                      onExportCsv={exportSingleCsv}
                    />
                  ))}
                  {recipients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border-0">
                        <div className="empty-state">
                          <div className="empty-state-icon">
                            <i className="bi bi-inbox"></i>
                          </div>
                          <h6 className="empty-state-title">No recipients yet</h6>
                          <p className="empty-state-text">
                            Import a file or add one manually to populate your scratchpad.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Edit modal */}
      <Modal show={editTarget !== null} onHide={() => setEditTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit recipient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editTarget !== null && (
            <Form onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }}>
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="edit-email">Email</Form.Label>
                <Form.Control
                  id="edit-email"
                  type="email"
                  value={editingRecipient?.email ?? ''}
                  disabled
                  className="form-control-reachy"
                />
                <div className="form-hint-reachy">
                  <i className="bi bi-info-circle"></i>
                  <span>Email cannot be changed.</span>
                </div>
              </div>
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="edit-name">Name</Form.Label>
                <Form.Control
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-control-reachy"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="field">
                <Form.Label className="form-label-reachy" htmlFor="edit-company">Company</Form.Label>
                <Form.Control
                  id="edit-company"
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="form-control-reachy"
                  placeholder="Acme Inc."
                />
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => setEditTarget(null)}>
            Cancel
          </Button>
          <button type="button" className="btn-submit-reachy" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={handleSaveEdit}>
            <i className="bi bi-check-lg"></i>
            Save changes
          </button>
        </Modal.Footer>
      </Modal>

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
