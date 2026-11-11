import Papa from 'papaparse'
import type { ImportedRecipient } from '../types'

export const STANDARD_COLUMNS = ['email', 'name', 'company'] as const

export const EXAMPLE_VALUE_MAP: Record<string, string> = {
  first_name: 'Alex',
  last_name: 'Johnson',
  job_title: 'Engineering Manager',
  industry: 'SaaS',
  product: 'Reachy',
  website: 'example.com',
  phone: '+1-555-0123',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexjohnson',
}

export function discoverMergeKeys(recipients: ImportedRecipient[]): string[] {
  const keys = new Set<string>()
  const standardLower = new Set(STANDARD_COLUMNS.map((c) => c.toLowerCase()))

  for (const r of recipients) {
    if (r.variables) {
      for (const key of Object.keys(r.variables)) {
        if (!standardLower.has(key.toLowerCase())) {
          keys.add(key)
        }
      }
    }
  }

  return Array.from(keys).sort()
}

export function buildExampleRow(mergeKeys: string[]): Record<string, string> {
  const row: Record<string, string> = {
    email: 'alex@example.com',
    name: 'Alex Johnson',
    company: 'Acme Corp',
  }

  for (const key of mergeKeys) {
    row[key] = EXAMPLE_VALUE_MAP[key] ?? '[your_value]'
  }

  return row
}

export function generateCSV(recipients: ImportedRecipient[]): Blob {
  const mergeKeys = discoverMergeKeys(recipients)
  const exampleRow = buildExampleRow(mergeKeys)

  const csv = Papa.unparse([exampleRow], { header: true })

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export async function generateExcel(recipients: ImportedRecipient[]): Promise<Blob> {
  const writeXlsxFile = (await import('write-excel-file/universal')).default

  const mergeKeys = discoverMergeKeys(recipients)
  const exampleRow = buildExampleRow(mergeKeys)
  const headers = [...STANDARD_COLUMNS, ...mergeKeys]

  const headerRow = headers.map((key) => ({
    value: key,
    fontWeight: 'bold' as const,
  }))

  const dataRow = headers.map((key) => ({
    type: String,
    value: exampleRow[key] ?? '',
  }))

  const columns = headers.map((key) => {
    const headerLength = key.length
    const valueLength = (exampleRow[key] ?? '').length
    const width = Math.max(headerLength, valueLength, 10)
    return { width: Math.min(width, 40) }
  })

  return await writeXlsxFile([headerRow, dataRow], {
    columns,
    sheet: 'Template',
  }).toBlob()
}

export async function generateTemplate(
  recipients: ImportedRecipient[],
  format: 'csv' | 'xlsx',
): Promise<Blob> {
  if (format === 'csv') {
    return generateCSV(recipients)
  }
  return generateExcel(recipients)
}
