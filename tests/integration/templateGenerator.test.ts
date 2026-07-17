import { describe, it, expect } from 'vitest'
import Papa from 'papaparse'
import { generateTemplate } from '../../src/utils/templateGenerator'
import type { ImportedRecipient } from '../../src/types'

async function csvRows(blob: Blob): Promise<Record<string, string>[]> {
  return Papa.parse<Record<string, string>>(await blob.text(), { header: true }).data
}

describe('generateTemplate (integration)', () => {
  it('generates CSV with standard columns only', async () => {
    const blob = await generateTemplate([], 'csv')
    expect(blob.type).toBe('text/csv;charset=utf-8;')
    const rows = await csvRows(blob)
    expect(Object.keys(rows[0])).toEqual(['email', 'name', 'company'])
  })

  it('includes merge variable columns from recipients', async () => {
    const recipients: ImportedRecipient[] = [
      { email: 'a@test.com', variables: { job_title: 'Engineer', industry: 'Tech' } },
      { email: 'b@test.com', variables: { job_title: 'Des', location: 'NYC' } },
    ]
    const row = (await csvRows(await generateTemplate(recipients, 'csv')))[0]
    expect(row).toHaveProperty('job_title', 'Engineering Manager')
    expect(row).toHaveProperty('industry', 'SaaS')
    expect(row).toHaveProperty('location', 'San Francisco, CA')
  })

  it('falls back for unknown merge keys', async () => {
    const recipients: ImportedRecipient[] = [{ email: 'a@test.com', variables: { weird_key: 'x' } }]
    expect((await csvRows(await generateTemplate(recipients, 'csv')))[0].weird_key).toBe('[your_value]')
  })

  it('excludes standard column duplicates from variables', async () => {
    const recipients: ImportedRecipient[] = [{ email: 'a@test.com', variables: { Name: 'd', COMPANY: 'd', custom_key: 'v' } }]
    const keys = Object.keys((await csvRows(await generateTemplate(recipients, 'csv')))[0])
    expect(keys).not.toContain('Name')
    expect(keys).not.toContain('COMPANY')
    expect(keys).toContain('custom_key')
  })

  it('generates Excel with correct MIME type', async () => {
    const blob = await generateTemplate([{ email: 'a@test.com', variables: { role: 'Admin' } }], 'xlsx')
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('sorts merge keys alphabetically', async () => {
    const recipients: ImportedRecipient[] = [{ email: 'a@test.com', variables: { z: '1', a: '2', m: '3' } }]
    const keys = Object.keys((await csvRows(await generateTemplate(recipients, 'csv')))[0])
    expect(keys.slice(3)).toEqual(['a', 'm', 'z'])
  })
})
