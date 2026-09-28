import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ExcelJS from 'exceljs'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplicationRepository,
  CompanyRepository,
  EventRepository,
  createDatabase
} from '../electron/main/db'
import { TransferRepository } from '../electron/main/db/transferRepository'
import {
  applicationIdentity,
  parseImportWorksheet
} from '../electron/main/services/transfer'

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('Excel transfer', () => {
  it('maps the existing JobFlow spreadsheet columns without losing batch data', () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('投递总览')
    sheet.addRow([
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
    ])
    sheet.addRow([
      'S',
      '字节跳动',
      'AI Agent Engineer',
      'AI Agent',
      '北京',
      '面试中',
      '二面待面',
      '准备系统设计',
      '2026-10-02',
      '2026-09-28',
      '2026-09-20',
      'Agent-V3',
      '秋招正式批',
      '内推',
      'REF-01',
      'JOB-123',
      'https://example.com/job',
      '进行中',
      '重点岗位'
    ])

    const rows = parseImportWorksheet(sheet)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      companyName: '字节跳动',
      jobTitle: 'AI Agent Engineer',
      priority: 'S',
      status: '面试中',
      batch: '秋招正式批',
      jobId: 'JOB-123',
      nextActionDate: '2026-10-02',
      applicationDate: '2026-09-20'
    })
  })

  it('uses company + job + optional Job ID for duplicate identity', () => {
    expect(
      applicationIdentity({
        companyName: ' ByteDance ',
        jobTitle: 'AI Agent',
        jobId: '123'
      })
    ).toBe('bytedance|ai agent|123')

    expect(
      applicationIdentity({
        companyName: 'ByteDance',
        jobTitle: 'AI Agent',
        jobId: null
      })
    ).toBe('bytedance|ai agent')
  })
})

describe('JSON backup repository', () => {
  it('restores companies, applications and timeline data as a full snapshot', () => {
    const directory = mkdtempSync(join(tmpdir(), 'jobflow-transfer-'))
    tempDirs.push(directory)
    const context = createDatabase(join(directory, 'test.db'))
    const companies = new CompanyRepository(context.db)
    const applications = new ApplicationRepository(context.db)
    const events = new EventRepository(context.db)
    const transfer = new TransferRepository(context.db)

    const company = companies.create({ name: 'JobFlow Labs' })
    const application = applications.create({
      companyId: company.id,
      jobTitle: 'AI Agent Engineer',
      status: '已投递'
    })
    events.create({
      applicationId: application.id,
      eventType: 'STATUS_CHANGED',
      title: '状态更新',
      newValue: '已投递'
    })

    const backup = transfer.dump()

    const extraCompany = companies.create({ name: 'Temporary Co' })
    applications.create({
      companyId: extraCompany.id,
      jobTitle: 'Temporary Role'
    })
    expect(transfer.dump().applications).toHaveLength(2)

    transfer.restore(backup)
    const restored = transfer.dump()

    expect(restored.companies).toHaveLength(1)
    expect(restored.applications).toHaveLength(1)
    expect(restored.applicationEvents).toHaveLength(1)
    expect(restored.applications[0]?.id).toBe(application.id)

    context.sqlite.close()
  })
})
