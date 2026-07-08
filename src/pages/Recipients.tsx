import { useState } from 'react'
import { Alert, Button, Card, Col, Dropdown, Form, Modal, Row, Table } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { addRecipient, addRecipients, clearRecipients, removeRecipients, updateRecipient } from '../store/recipientsSlice'
import { AnimatedPage } from '../components/AnimatedPage'
import { ConfirmModal } from '../components/ConfirmModal'
import { FileDropzone } from '../components/FileDropzone'
import { useToast } from '../components/ToastProvider'
import { recipientsToCsv } from '../utils/fileParsers'
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
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [editTarget, setEditTarget] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [bulkDelete, setBulkDelete] = useState(false)
  const [clearAll, setClearAll] = useState(false)

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

  const toggleAll = () => {
    if (selected.size === recipients.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(recipients.map((_, i) => i)))
    }
  }

  const toggleOne = (idx: number) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const openEdit = (i: number) => {
    setEditTarget(i)
    setEditName(recipients[i].name ?? '')
    setEditCompany(recipients[i].company ?? '')
  }

  const handleSaveEdit = () => {
    if (editTarget !== null) {
      dispatch(updateRecipient({ index: editTarget, data: { name: editName.trim() || undefined, company: editCompany.trim() || undefined } }))
      setEditTarget(null)
      toast('Recipient updated', 'success')
    }
  }

  const handleDeleteSingle = () => {
    if (deleteTarget !== null) {
      const removed = recipients[deleteTarget]
      dispatch(removeRecipients([deleteTarget]))
      setDeleteTarget(null)
      if (removed) toast(`Removed ${removed.email}`, 'success')
    }
  }

  const handleBulkDelete = () => {
    const count = selected.size
    dispatch(removeRecipients(Array.from(selected)))
    setSelected(new Set())
    setBulkDelete(false)
    toast(`${count} ${count === 1 ? 'recipient' : 'recipients'} removed`, 'success')
  }

  const handleClearAll = () => {
    const count = recipients.length
    dispatch(clearRecipients())
    setSelected(new Set())
    setClearAll(false)
    toast(`All ${count} recipients cleared`, 'success')
  }

  const exportAllJson = () => download('recipients.json', JSON.stringify(recipients, null, 2), 'application/json')

  const exportAllCsv = () => download('recipients.csv', recipientsToCsv(recipients), 'text/csv')

  const exportSingleJson = (i: number) =>
    download(`recipient-${recipients[i].email}.json`, JSON.stringify([recipients[i]], null, 2), 'application/json')

  const exportSingleCsv = (i: number) =>
    download(`recipient-${recipients[i].email}.csv`, recipientsToCsv([recipients[i]]), 'text/csv')

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
                    <tr key={`${r.email}-${i}`}>
                      <td>
                        <Form.Check
                          checked={selected.has(i)}
                          onChange={() => toggleOne(i)}
                          aria-label={`Select ${r.email}`}
                        />
                      </td>
                      <td className="fw-medium cell-email" title={r.email}>{r.email}</td>
                      <td className="col-name">{r.name || '—'}</td>
                      <td className="col-company">{r.company || '—'}</td>
                      <td className="cell-actions text-end">
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            variant="link"
                            className="p-1 border-0 no-caret row-action-toggle"
                            aria-label={`Actions for ${r.email}`}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => openEdit(i)}>
                              <i className="bi bi-pencil me-2"></i>Edit
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => setDeleteTarget(i)} className="text-danger">
                              <i className="bi bi-trash me-2"></i>Delete
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => exportSingleJson(i)}>
                              <i className="bi bi-download me-2"></i>Export as JSON
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => exportSingleCsv(i)}>
                              <i className="bi bi-filetype-csv me-2"></i>Export as CSV
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
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
                  value={recipients[editTarget].email}
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
        message={deleteTarget !== null ? `Remove "${recipients[deleteTarget].email}" from your list? This cannot be undone.` : ''}
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
