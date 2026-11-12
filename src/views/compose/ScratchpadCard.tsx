import { Card } from 'react-bootstrap'
import { SectionHeader } from '../../components/SectionHeader'
import { FileDropzone } from '../../components/FileDropzone'
import type { ImportedRecipient } from '../../types'

interface ScratchpadCardProps {
  count: number
  onUpload: (parsed: ImportedRecipient[]) => void
}

/** Upload card for the campaign's recipient scratchpad. */
export function ScratchpadCard({ count, onUpload }: ScratchpadCardProps) {
  return (
    <div>
      <Card className="card-reachy border-0">
        <Card.Body className="p-4">
          <SectionHeader
            icon="bi-people"
            title="Recipients"
            description={`${count} in scratchpad`}
            className="mb-3"
          />
          <FileDropzone onUpload={onUpload} />
          <div className="info-hint mt-3">
            <i className="bi bi-info-circle"></i>
            <span>Recipients from the scratchpad are included. Upload more files to add.</span>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
