import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Alert } from 'react-bootstrap'
import { parseCsvFile, parseExcelFile, parseJsonFile } from '../utils/fileParsers'
import { Skeleton } from './Skeleton'
import type { ImportedRecipient } from '../types'

interface FileDropzoneProps {
  onUpload: (recipients: ImportedRecipient[]) => void
}

export function FileDropzone({ onUpload }: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null)
      setLoading(true)

      try {
        const all: ImportedRecipient[] = []
        for (const file of acceptedFiles) {
          const ext = file.name.split('.').pop()?.toLowerCase()
          let parsed: ImportedRecipient[]

          if (ext === 'json') {
            parsed = await parseJsonFile(file)
          } else if (ext === 'csv') {
            parsed = await parseCsvFile(file)
          } else if (ext === 'xlsx' || ext === 'xls') {
            parsed = await parseExcelFile(file)
          } else {
            throw new Error(`Unsupported file type: ${file.name}`)
          }

          all.push(...parsed)
        }

        onUpload(all)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file')
      } finally {
        setLoading(false)
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
    maxSize: 5 * 1024 * 1024,
    maxFiles: 10,
  })

  const rejectionMessage = fileRejections.length > 0
    ? `${fileRejections.length} file(s) rejected. Max 10 files, 5 MB each. Only JSON, CSV, and Excel are supported.`
    : null

  return (
    <div className="flex-grow-1 d-flex">
      <div {...getRootProps()} className={`dropzone flex-grow-1 d-flex flex-column align-items-center justify-content-center ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {loading ? (
          <div className="d-flex flex-column align-items-center gap-3 py-3">
            <Skeleton width={48} height={48} borderRadius={12} />
            <Skeleton width="60%" height={16} borderRadius={6} />
            <Skeleton width="40%" height={12} borderRadius={6} />
          </div>
        ) : (
          <>
            <i className="bi bi-cloud-arrow-up fs-1 text-primary"></i>
            <p className="mt-2 mb-1 fw-medium text-center">
              <span className="d-none d-sm-inline">{isDragActive ? 'Drop files here' : 'Drag & drop files here'}</span>
              <span className="d-sm-none">{isDragActive ? 'Drop files' : 'Tap to browse'}</span>
            </p>
            <p className="text-muted small mb-0">Supports JSON, CSV, XLSX</p>
          </>
        )}
      </div>
      {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
      {rejectionMessage && <Alert variant="warning" className="mt-3 mb-0">{rejectionMessage}</Alert>}
    </div>
  )
}
