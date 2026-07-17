import { describe, it, expect, vi } from 'vitest'
import Papa from 'papaparse'
import { parseJsonFile, parseCsvFile, recipientsToCsv } from '../../src/utils/fileParsers'
import type { ImportedRecipient } from '../../src/types'

vi.mock('read-excel-file/browser', () => ({
  readSheet: vi.fn(),
}))

function jsonFile(content: unknown): File {
  return new File([JSON.stringify(content)], 'test.json', { type: 'application/json' })
}

function csvFile(csv: string): File {
  return new File([csv], 'test.csv', { type: 'text/csv' })
}

describe('parseJsonFile', () => {
  it('parses a flat array', async () => {
    const data = [{ email: 'alice@test.com', Name: 'Alice', company: 'Acme', role: 'Eng' }, { email: 'bob@test.com', name: 'Bob', Company: 'Beta', role: 'Des' }]
    const result = await parseJsonFile(jsonFile(data))
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ email: 'alice@test.com', name: 'Alice', company: 'Acme' })
    expect(result[0].variables).toEqual({ role: 'Eng' })
  })

  it('parses { recipients } wrapper', async () => {
    const result = await parseJsonFile(jsonFile({ recipients: [{ email: 'a@b.com' }] }))
    expect(result).toHaveLength(1)
  })

  it('parses { data } wrapper', async () => {
    const result = await parseJsonFile(jsonFile({ data: [{ email: 'a@b.com' }] }))
    expect(result).toHaveLength(1)
  })

  it('rejects invalid JSON', async () => {
    await expect(parseJsonFile(new File(['not json'], 'bad.json', { type: 'application/json' }))).rejects.toThrow('Invalid JSON file')
  })

  it('filters rows without valid email', async () => {
    const result = await parseJsonFile(jsonFile([{ email: 'a@b.com' }, { email: 'bad' }, { name: 'No' }]))
    expect(result).toHaveLength(1)
  })

  it('handles bare email strings', async () => {
    const result = await parseJsonFile(jsonFile(['a@b.com', 'invalid', 'c@d.com']))
    expect(result).toHaveLength(2)
  })

  it('normalizes email to lowercase', async () => {
    const result = await parseJsonFile(jsonFile([{ email: 'ALICE@TEST.COM' }, { Email: 'BOB@TEST.COM' }]))
    expect(result[0].email).toBe('alice@test.com')
    expect(result[1].email).toBe('bob@test.com')
  })

  it('extracts non-standard columns as variables (lowercased)', async () => {
    const result = await parseJsonFile(jsonFile([{ email: 'a@b.com', Job_Title: 'Eng', Department: 'Sales' }]))
    expect(result[0].variables).toEqual({ job_title: 'Eng', department: 'Sales' })
  })

  it('omits variables for standard-only columns', async () => {
    const result = await parseJsonFile(jsonFile([{ email: 'a@b.com', name: 'A', company: 'C' }]))
    expect(result[0].variables).toBeUndefined()
  })

  it('handles null/undefined values gracefully', async () => {
    const result = await parseJsonFile(jsonFile([{ email: 'a@b.com', name: null, company: undefined, extra: 'val' }]))
    expect(result[0].name).toBeUndefined()
    expect(result[0].company).toBeUndefined()
    expect(result[0].variables).toEqual({ extra: 'val' })
  })
})

describe('parseCsvFile', () => {
  it('parses CSV with headers', async () => {
    const csv = 'email,name,company,role\njohn@test.com,John,Acme,Engineer\njane@test.com,Jane,Beta,Designer'
    const result = await parseCsvFile(csvFile(csv))
    expect(result).toHaveLength(2)
    expect(result[0].variables).toEqual({ role: 'Engineer' })
  })

  it('handles varied column casing', async () => {
    const result = await parseCsvFile(csvFile('Email,NAME,Company\nu@t.com,Upper,Corp'))
    expect(result[0]).toMatchObject({ email: 'u@t.com', name: 'Upper', company: 'Corp' })
  })

  it('filters rows without valid email', async () => {
    const result = await parseCsvFile(csvFile('email\nok@t.com\nnotanemail'))
    expect(result).toHaveLength(1)
  })
})

describe('recipientsToCsv', () => {
  it('preserves email/name/company + variables JSON column', () => {
    const recipients: ImportedRecipient[] = [{ email: 'a@b.com', name: 'A', company: 'C', variables: { role: 'Eng' } }]
    const parsed = Papa.parse<Record<string, string>>(recipientsToCsv(recipients), { header: true })
    expect(parsed.data[0].email).toBe('a@b.com')
    expect(parsed.data[0]).toHaveProperty('variables')
  })

  it('works without variables', () => {
    const csv = recipientsToCsv([{ email: 'a@b.com' }])
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true })
    expect(parsed.data[0].email).toBe('a@b.com')
  })
})
