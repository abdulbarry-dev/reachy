import { Button } from 'react-bootstrap'
import type { EmailAccount } from '../../types'

interface AccountRowProps {
  acc: EmailAccount
  onDelete: (id: string) => void
}

/** One connected sender: avatar, name/address, host badge and a remove button. */
export function AccountRow({ acc, onDelete }: AccountRowProps) {
  const initials = acc.from_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div>
      <div className="account-item">
        <div className="d-flex align-items-center gap-3">
          <div className="account-avatar">{initials || '?'}</div>
          <div>
            <div className="fw-bold text-dark">{acc.from_name}</div>
            <div className="small text-muted">{acc.from_email}</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-muted border d-none d-md-inline account-host-badge">
            {acc.smtp_host}:{acc.smtp_port}
          </span>
          <Button
            variant="outline-danger"
            size="sm"
            className="rounded-circle d-inline-flex align-items-center justify-content-center account-delete-btn"
            onClick={() => onDelete(acc.id)}
            aria-label={`Delete ${acc.from_email} account`}
          >
            <i className="bi bi-trash" aria-hidden="true"></i>
          </Button>
        </div>
      </div>
    </div>
  )
}
