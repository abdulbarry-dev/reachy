import { Button, Card, Form, Table } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { RecipientRow } from '../../components/RecipientRow'
import type { ImportedRecipient } from '../../types'

interface RecipientsTableCardProps {
  recipients: ImportedRecipient[]
  selected: Set<string>
  onToggleAll: () => void
  onToggleOne: (recipient: ImportedRecipient) => void
  onEdit: (recipient: ImportedRecipient) => void
  onDelete: (recipient: ImportedRecipient) => void
  onExportJson: (recipient: ImportedRecipient) => void
  onExportCsv: (recipient: ImportedRecipient) => void
  onExportAllJson: () => void
  onExportAllCsv: () => void
  onRequestBulkDelete: () => void
  onRequestClearAll: () => void
}

/** The list card: count, export/bulk toolbar, selectable table, empty state. */
export function RecipientsTableCard({
  recipients,
  selected,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
  onExportJson,
  onExportCsv,
  onExportAllJson,
  onExportAllCsv,
  onRequestBulkDelete,
  onRequestClearAll,
}: RecipientsTableCardProps) {
  return (
    <div>
      <Card className="card-reachy border-0">
        <Card.Body className="p-4">
          {/* Toolbar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <SectionHeader
              icon="bi-list-ul"
              title="Recipients list"
              description={`${recipients.length} ${recipients.length === 1 ? 'contact' : 'contacts'}`}
            />
            <div className="d-flex gap-2 flex-wrap toolbar-actions">
              <Button
                variant="outline-secondary"
                size="sm"
                className="btn-reachy-outline btn-reachy-sm gap-1"
                onClick={onExportAllJson}
                disabled={recipients.length === 0}
              >
                <i className="bi bi-download"></i>
                JSON
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className="btn-reachy-outline btn-reachy-sm gap-1"
                onClick={onExportAllCsv}
                disabled={recipients.length === 0}
              >
                <i className="bi bi-filetype-csv"></i>
                CSV
              </Button>
              {selected.size > 0 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="btn-reachy-danger btn-reachy-sm gap-1"
                  onClick={onRequestBulkDelete}
                >
                  <i className="bi bi-trash"></i>
                  Delete ({selected.size})
                </Button>
              )}
              <Button
                variant="outline-danger"
                size="sm"
                className="btn-reachy-danger btn-reachy-sm gap-1"
                onClick={onRequestClearAll}
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
                  <th className="col-check">
                    <Form.Check
                      checked={recipients.length > 0 && selected.size === recipients.length}
                      onChange={onToggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Email</th>
                  <th className="col-name">Name</th>
                  <th className="col-company">Company</th>
                  <th className="col-actions text-end pe-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <RecipientRow
                    key={r.email}
                    recipient={r}
                    selected={selected.has(r.email)}
                    onToggle={onToggleOne}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExportJson={onExportJson}
                    onExportCsv={onExportCsv}
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
  )
}
