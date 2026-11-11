import { Card, Col } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { FileDropzone } from '../../components/FileDropzone'
import type { ImportedRecipient } from '../../types'

interface ImportFromFileCardProps {
  onUpload: (parsed: ImportedRecipient[]) => void
  onDownloadTemplate: (format: 'csv' | 'xlsx') => void
  downloading: boolean
}

/** Left column of the import row: file dropzone plus the template downloads. */
export function ImportFromFileCard({ onUpload, onDownloadTemplate, downloading }: ImportFromFileCardProps) {
  return (
    <Col lg={7} className="min-w-0">
      <div className="h-100 min-w-0">
        <Card className="card-reachy border-0 h-100">
          <Card.Body className="p-4 d-flex flex-column">
            <SectionHeader
              icon="bi-cloud-arrow-up"
              title="Import from file"
              description="JSON, CSV, or Excel"
              className="mb-4"
            />
            <FileDropzone onUpload={onUpload} />
            <div className="d-flex align-items-center gap-2 mt-3 pt-2 border-top">
              <span className="small text-muted me-1">Need a template?</span>
              <button
                type="button"
                className="btn-reachy-outline btn-reachy-sm gap-1"
                onClick={() => onDownloadTemplate('csv')}
                disabled={downloading}
              >
                <i className="bi bi-filetype-csv"></i>
                CSV
              </button>
              <button
                type="button"
                className="btn-reachy-outline btn-reachy-sm gap-1"
                onClick={() => onDownloadTemplate('xlsx')}
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
  )
}
