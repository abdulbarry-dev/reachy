import { useState } from 'react'
import { Button, Form, Table } from 'react-bootstrap'
import type { Recipient } from '../types'

interface RecipientTableProps {
  recipients: Recipient[]
  onRemove: (ids: string[]) => void
}

export function RecipientTable({ recipients, onRemove }: RecipientTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleAll = () => {
    if (selected.size === recipients.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(recipients.map((r) => r.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const statusBadge = (status?: Recipient['status']) => {
    switch (status) {
      case 'sent':
        return <span className="badge text-bg-success">Sent</span>
      case 'failed':
        return <span className="badge text-bg-danger">Failed</span>
      default:
        return <span className="badge text-bg-secondary">Pending</span>
    }
  }

  return (
    <div className="card-reachy p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Recipient list</h5>
        <Button
          variant="outline-danger"
          size="sm"
          disabled={selected.size === 0}
          onClick={() => {
            onRemove(Array.from(selected))
            setSelected(new Set())
          }}
        >
          <i className="bi bi-trash me-1"></i>
          Remove selected ({selected.size})
        </Button>
      </div>

      <div className="table-responsive">
        <Table hover className="table-reachy mb-0 align-middle">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <Form.Check
                  checked={recipients.length > 0 && selected.size === recipients.length}
                  onChange={toggleAll}
                />
              </th>
              <th>Email</th>
              <th>Name</th>
              <th>Company</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient) => (
              <tr key={recipient.id}>
                <td>
                  <Form.Check
                    checked={selected.has(recipient.id)}
                    onChange={() => toggleOne(recipient.id)}
                  />
                </td>
                <td className="fw-medium cell-email" title={recipient.email}>{recipient.email}</td>
                <td>{recipient.name || '—'}</td>
                <td>{recipient.company || '—'}</td>
                <td>{statusBadge(recipient.status)}</td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No recipients yet. Import a file or add one manually.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
