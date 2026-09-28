import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import ExcelJS, { type Cell, type Worksheet } from 'exceljs'
import {
  applicationPriorities,
  applicationStatuses
} from '../../../src/shared/application'
import type {
  BackupRestoreResult,
  ExcelImportDuplicate,
  ExcelImportPreview,
  ExcelImportResult,
  FileOperationResult
} from '../../../src/shared/transfer'
import type { JobFlowDatabase } from '../db/client'
import {
  TransferRepository,
  type BackupData,
  type ImportedApplicationRow
} from '../db/transferRepository'

interface ImportCandidate extends ImportedApplicationRow {
  rowNumber: number
}

interface ImportSession {
  fileName: string
  rows: ImportCandidate[]
}

const sessions = new Map<string, ImportSession>()

const COLUMN_NAMES = [
  '优先级',
  '公司',
  '岗位',
  '岗位方向',
  'Base',
  '当前阶段',
  '当前节点',
  '下一步',
  '下一步日期',
  '最近进展日期',
  '投递日期',
  '简历版本',
  '批次',
  '投递渠道',
  '内推人/内推码',
  'Job ID',
  'JD链接',
  '最终结果',
  '备注'
] as const

function text(cell: Cell | undefined): string | null {
  if (!cell) return null
  const value = cell.text.trim()
  return value || null
}

function dateText(cell: Cell | undefined): string | null {
  if (!cell) return null

  if (cell.value instanceof Date) {
    const year = cell.value.getFullYear()
    const month = String(cell.value.getMonth() + 1).padStart(2, '0')
    const day = String(cell.value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const value = cell.text.trim()
  if (!value) return null

  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(value)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toIsoDay(value: string | null): string | null {
  return value ? `${value}T00:00:00.000Z` : null
}

function normalizePriority(value: string | null): string {
  return value && applicationPriorities.includes(value as (typeof applicationPriorities)[number])
    ? value
    : 'A'
}

function normalizeStatus(value: string | null): string {
  return value && applicationStatuses.includes(value as (typeof applicationStatuses)[number])
    ? value
    : '待投递'
}

function normalizeIdentityPart(value: string | null): string {
  return (value ?? '').trim().toLocaleLowerCase()
}

export function applicationIdentity(input: {
  companyName: string
  jobTitle: string
  jobId: string | null
}): string {
  const company = normalizeIdentityPart(input.companyName)
  const title = normalizeIdentityPart(input.jobTitle)
  const jobId = normalizeIdentityPart(input.jobId)
  return jobId ? `${company}|${title}|${jobId}` : `${company}|${title}`
}

function findHeaderRow(worksheet: Worksheet): {
  rowNumber: number
  columns: Map<string, number>
} {
  const maxRows = Math.min(worksheet.rowCount, 12)

  for (let rowNumber = 1; rowNumber <= maxRows; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const columns = new Map<string, number>()

    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const name = cell.text.trim()
      if (COLUMN_NAMES.includes(name as (typeof COLUMN_NAMES)[number])) {
        columns.set(name, columnNumber)
      }
    })

    if (columns.has('公司') && columns.has('岗位')) {
      return { rowNumber, columns }
    }
  }

  throw new Error('未找到包含“公司”和“岗位”的表头。')
}

export function parseImportWorksheet(worksheet: Worksheet): ImportCandidate[] {
  const header = findHeaderRow(worksheet)
  const rows: ImportCandidate[] = []

  const cell = (rowNumber: number, name: string): Cell | undefined => {
    const column = header.columns.get(name)
    return column ? worksheet.getRow(rowNumber).getCell(column) : undefined
  }

  for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const companyName = text(cell(rowNumber, '公司'))
    const jobTitle = text(cell(rowNumber, '岗位'))
    if (!companyName || !jobTitle) continue

    const lastProgressDate = dateText(cell(rowNumber, '最近进展日期'))

    rows.push({
      rowNumber,
      companyName,
      jobTitle,
      direction: text(cell(rowNumber, '岗位方向')),
      location: text(cell(rowNumber, 'Base')),
      priority: normalizePriority(text(cell(rowNumber, '优先级'))),
      status: normalizeStatus(text(cell(rowNumber, '当前阶段'))),
      stage: text(cell(rowNumber, '当前节点')),
      batch: text(cell(rowNumber, '批次')),
      jobUrl: text(cell(rowNumber, 'JD链接')),
      jobId: text(cell(rowNumber, 'Job ID')),
      channel: text(cell(rowNumber, '投递渠道')),
      referral: text(cell(rowNumber, '内推人/内推码')),
      resumeVersion: text(cell(rowNumber, '简历版本')),
      applicationDate: dateText(cell(rowNumber, '投递日期')),
      nextAction: text(cell(rowNumber, '下一步')),
      nextActionDate: dateText(cell(rowNumber, '下一步日期')),
      lastProgressAt: toIsoDay(lastProgressDate),
      finalResult: text(cell(rowNumber, '最终结果')),
      notes: text(cell(rowNumber, '备注'))
    })
  }

  return rows
}

function duplicateInfo(row: ImportCandidate): ExcelImportDuplicate {
  return {
    rowNumber: row.rowNumber,
    companyName: row.companyName,
    jobTitle: row.jobTitle,
    jobId: row.jobId
  }
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return (
    Array.isArray(data.companies) &&
    Array.isArray(data.applications) &&
    Array.isArray(data.applicationEvents) &&
    Array.isArray(data.interviews) &&
    Array.isArray(data.settings)
  )
}

export class TransferService {
  private readonly repository: TransferRepository

  constructor(db: JobFlowDatabase) {
    this.repository = new TransferRepository(db)
  }

  async previewExcel(filePath: string): Promise<ExcelImportPreview> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)
    const worksheet = workbook.getWorksheet('投递总览') ?? workbook.worksheets[0]
    if (!worksheet) throw new Error('Excel 中没有可读取的工作表。')

    const rows = parseImportWorksheet(worksheet)
    const existing = new Set(
      this.repository.listApplicationIdentities().map(applicationIdentity)
    )
    const seen = new Set<string>()
    const duplicates: ExcelImportDuplicate[] = []

    for (const row of rows) {
      const key = applicationIdentity(row)
      if (existing.has(key) || seen.has(key)) duplicates.push(duplicateInfo(row))
      seen.add(key)
    }

    const sessionId = randomUUID()
    sessions.set(sessionId, { fileName: basename(filePath), rows })

    return {
      sessionId,
      fileName: basename(filePath),
      totalRows: rows.length,
      importableRows: rows.length - duplicates.length,
      duplicateRows: duplicates.length,
      duplicates: duplicates.slice(0, 20)
    }
  }

  confirmExcelImport(sessionId: string): ExcelImportResult {
    const session = sessions.get(sessionId)
    if (!session) throw new Error('导入预览已失效，请重新选择 Excel。')

    const existing = new Set(
      this.repository.listApplicationIdentities().map(applicationIdentity)
    )
    let imported = 0
    let skippedDuplicates = 0

    for (const row of session.rows) {
      const key = applicationIdentity(row)
      if (existing.has(key)) {
        skippedDuplicates += 1
        continue
      }

      this.repository.importApplication(row)
      existing.add(key)
      imported += 1
    }

    sessions.delete(sessionId)
    return { imported, skippedDuplicates }
  }

  async exportExcel(filePath: string): Promise<FileOperationResult> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'JobFlow'
    const worksheet = workbook.addWorksheet('投递总览', {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    worksheet.columns = COLUMN_NAMES.map((header) => ({
      header,
      key: header,
      width: header === '岗位' || header === '备注' ? 28 : 16
    }))

    const rows = this.repository.listApplicationsForExport()
    for (const row of rows) {
      worksheet.addRow({
        优先级: row.priority,
        公司: row.companyName,
        岗位: row.jobTitle,
        岗位方向: row.direction,
        Base: row.location,
        当前阶段: row.status,
        当前节点: row.stage,
        下一步: row.nextAction,
        下一步日期: row.nextActionDate,
        最近进展日期: row.lastProgressAt?.slice(0, 10) ?? null,
        投递日期: row.applicationDate,
        简历版本: row.resumeVersion,
        批次: row.batch,
        投递渠道: row.channel,
        '内推人/内推码': row.referral,
        'Job ID': row.jobId,
        JD链接: row.jobUrl,
        最终结果: row.finalResult,
        备注: row.notes
      })
    }

    const header = worksheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF24324A' }
    }
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, worksheet.rowCount), column: COLUMN_NAMES.length }
    }

    await workbook.xlsx.writeFile(filePath)
    return { filePath, fileName: basename(filePath) }
  }

  async exportBackup(filePath: string): Promise<FileOperationResult> {
    const envelope = {
      format: 'jobflow-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      data: this.repository.dump()
    }

    await writeFile(filePath, JSON.stringify(envelope, null, 2), 'utf8')
    return { filePath, fileName: basename(filePath) }
  }

  async importBackup(filePath: string): Promise<BackupRestoreResult> {
    const raw = await readFile(filePath, 'utf8')
    const envelope = JSON.parse(raw) as {
      format?: unknown
      version?: unknown
      data?: unknown
    }

    if (
      envelope.format !== 'jobflow-backup' ||
      envelope.version !== 1 ||
      !isBackupData(envelope.data)
    ) {
      throw new Error('不是有效的 JobFlow v1 备份文件。')
    }

    this.repository.restore(envelope.data)

    return {
      companies: envelope.data.companies.length,
      applications: envelope.data.applications.length,
      events: envelope.data.applicationEvents.length,
      interviews: envelope.data.interviews.length,
      settings: envelope.data.settings.length
    }
  }
}
