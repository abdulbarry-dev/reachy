/**
 * Hands a blob to the browser as a file download.
 *
 * The object URL is revoked immediately after the synthetic click: the
 * navigation has already been queued, so the bytes stay available, and
 * skipping the revoke would leak one URL per export.
 */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadText(filename: string, content: string, type: string): void {
  downloadBlob(filename, new Blob([content], { type }))
}
