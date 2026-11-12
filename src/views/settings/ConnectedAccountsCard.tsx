import { Card, Col } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { Skeleton } from '../../components/Skeleton'
import { AccountRow } from './AccountRow'
import type { EmailAccount } from '../../types'

interface ConnectedAccountsCardProps {
  accounts: EmailAccount[]
  loading: boolean
  onDelete: (id: string) => void
}

/** Right column: the connected senders, with loading and empty states. */
export function ConnectedAccountsCard({ accounts, loading, onDelete }: ConnectedAccountsCardProps) {
  return (
    <Col lg={5}>
      <div className="h-100">
        <Card className="card-reachy border-0 h-100">
          <Card.Body className="p-4">
            <SectionHeader
              icon="bi-list-nested"
              title="Connected accounts"
              description={
                <>
                  {!loading && `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} connected`}
                  {loading && 'Loading...'}
                </>
              }
              className="mb-4"
            />

            {loading ? (
              <div>
                {[0, 1].map((i) => (
                  <div key={i} className="account-item">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <Skeleton width={40} height={40} borderRadius={10} />
                      <div className="flex-grow-1">
                        <Skeleton width="50%" height={16} borderRadius={6} />
                        <Skeleton width="80%" height={13} borderRadius={6} className="mt-1" />
                      </div>
                    </div>
                    <Skeleton width={34} height={34} borderRadius={17} />
                  </div>
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="bi bi-inbox"></i>
                </div>
                <h6 className="empty-state-title">No accounts connected</h6>
                <p className="empty-state-text">
                  Connect your first Gmail account to start sending campaigns.
                </p>
              </div>
            ) : (
              <div>
                {accounts.map((acc) => (
                  <AccountRow key={acc.id} acc={acc} onDelete={onDelete} />
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </Col>
  )
}
