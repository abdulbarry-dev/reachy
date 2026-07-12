import { memo, useCallback } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import type { ImportedRecipient } from '../types'

interface RecipientRowProps {
  recipient: ImportedRecipient
  index: number
  selected: boolean
  onToggle: (email: string) => void
  onEdit: (email: string) => void
  onDelete: (email: string) => void
  onExportJson: (index: number) => void
  onExportCsv: (index: number) => void
}

export const RecipientRow = memo(function RecipientRow({
  recipient,
  index,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onExportJson,
  onExportCsv,
}: RecipientRowProps) {
  const handleToggle = useCallback(() => onToggle(recipient.email), [onToggle, recipient.email])
  const handleEdit = useCallback(() => onEdit(recipient.email), [onEdit, recipient.email])
  const handleDelete = useCallback(() => onDelete(recipient.email), [onDelete, recipient.email])
  const handleExportJson = useCallback(() => onExportJson(index), [onExportJson, index])
  const handleExportCsv = useCallback(() => onExportCsv(index), [onExportCsv, index])

  return (
    <tr>
      <td>
        <Form.Check
          checked={selected}
          onChange={handleToggle}
          aria-label={`Select ${recipient.email}`}
        />
      </td>
      <td className="fw-medium cell-email" title={recipient.email}>{recipient.email}</td>
      <td className="col-name">{recipient.name || '—'}</td>
      <td className="col-company">{recipient.company || '—'}</td>
      <td className="cell-actions text-end">
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="link"
            className="p-1 border-0 no-caret row-action-toggle"
            aria-label={`Actions for ${recipient.email}`}
          >
            <i className="bi bi-three-dots-vertical" />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleEdit}>
              <i className="bi bi-pencil me-2" />Edit
            </Dropdown.Item>
            <Dropdown.Item onClick={handleDelete} className="text-danger">
              <i className="bi bi-trash me-2" />Delete
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleExportJson}>
              <i className="bi bi-download me-2" />Export as JSON
            </Dropdown.Item>
            <Dropdown.Item onClick={handleExportCsv}>
              <i className="bi bi-filetype-csv me-2" />Export as CSV
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </td>
    </tr>
  )
})

RecipientRow.displayName = 'RecipientRow'