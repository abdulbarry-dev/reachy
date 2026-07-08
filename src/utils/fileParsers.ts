import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ImportedRecipient } from '../types'

function isEmail(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(s) ? s.toLowerCase() : null
}

function looksLikeHeaderRow(row: unknown[]): boolean {
  if (!Array.isArray(row) || row.length === 0) return false
  const first = String(row[0]).trim().toLowerCase()
  return first.includes('email') || first.includes('name') || first.includes('company')
}

export function parseJsonFile(file: File): Promise<ImportedRecipient[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const rows = Array.isArray(parsed) ? parsed : parsed?.recipients ?? parsed?.data ?? []
        resolve(normalizeRows(rows))
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

export function parseCsvFile(file: File): Promise<ImportedRecipient[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(normalizeRows(results.data)),
      error: (err) => reject(new Error(err.message)),
    })
  })
}

export function parseExcelFile(file: File): Promise<ImportedRecipient[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 }) as unknown[][]
        resolve(normalizeSheetRows(rows))
      } catch {
        reject(new Error('Invalid Excel file'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsArrayBuffer(file)
  })
}

function normalizeRows(rows: unknown[]): ImportedRecipient[] {
  const recipients: ImportedRecipient[] = []

  for (const row of rows) {
    if (typeof row === 'string') {
      const email = isEmail(row)
      if (email) recipients.push({ email })
      continue
    }

    if (!row || typeof row !== 'object') continue

    const record = row as Record<string, unknown>
    const email = isEmail(record.email ?? record.Email ?? record.EMAIL ?? record.mail)
    if (!email) continue

    recipients.push({
      email,
      name: normalizeString(record.name ?? record.Name ?? record.NAME),
      company: normalizeString(record.company ?? record.Company ?? record.COMPANY),
      variables: extractVariables(record),
    })
  }

  return recipients
}

function normalizeSheetRows(rows: unknown[][]): ImportedRecipient[] {
  if (rows.length === 0) return []

  const hasHeader = looksLikeHeaderRow(rows[0])
  const headers = hasHeader
    ? rows[0].map((h) => String(h).trim().toLowerCase())
    : rows[0].map((_, i) => `col${i}`)
  const dataRows = hasHeader ? rows.slice(1) : rows

  return dataRows
    .map((row) => {
      const record: Record<string, unknown> = {}
      row.forEach((cell, i) => {
        record[headers[i] ?? `col${i}`] = cell
      })
      return record
    })
    .filter((record) => isEmail(record.email ?? record.mail))
    .map((record) => ({
      email: isEmail(record.email ?? record.mail) as string,
      name: normalizeString(record.name),
      company: normalizeString(record.company),
      variables: extractVariables(record),
    }))
}

function normalizeString(value: unknown): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return s || undefined
}

function extractVariables(record: Record<string, unknown>): Record<string, string> | undefined {
  const vars: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    const normalized = key.trim()
    if (['email', 'name', 'company'].includes(normalized.toLowerCase())) continue
    if (value != null) {
      vars[normalized] = String(value).trim()
    }
  }
  return Object.keys(vars).length > 0 ? vars : undefined
}

export function recipientsToCsv(recipients: ImportedRecipient[]): string {
  return Papa.unparse(recipients)
}
