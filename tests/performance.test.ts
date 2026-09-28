import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplicationRepository,
  CompanyRepository,
  createDatabase,
  runInTransaction
} from '../electron/main/db'
import { buildTodayDashboard } from '../electron/main/services/today'
import {
  filterAndSortApplications,
  type ApplicationFilters
} from '../src/features/applications/applicationFilters'
import type { ApplicationListItem } from '../src/shared/application'
import type { TodayEventItem, TodayInterviewItem } from '../src/shared/today'

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function application(index: number): ApplicationListItem {
  const day = String((index % 28) + 1).padStart(2, '0')
  return {
    id: `application-${index}`,
    companyId: `company-${index}`,
    companyName: `Company ${index}`,
    jobTitle: index % 3 === 0 ? 'AI Agent Engineer' : `Engineer ${index}`,
    direction: index % 2 === 0 ? 'AI Agent' : 'RAG/检索',
    recruitmentType: index % 2 === 0 ? '校招' : '实习',
    location: index % 4 === 0 ? '上海' : '北京',
    priority: ['S', 'A', 'B', 'C'][index % 4] ?? 'A',
    status: ['已投递', '测评/笔试', '面试中', 'Offer阶段'][index % 4] ?? '已投递',
    stage: index % 3 === 0 ? '二面' : null,
    channel: index % 2 === 0 ? '官网' : '内推',
    nextAction: '跟进',
    nextActionDate: `2026-10-${day}`,
    applicationDate: `2026-09-${day}`,
    lastProgressAt: `2026-09-${day}T08:00:00.000Z`,
    updatedAt: `2026-09-${day}T08:00:00.000Z`
  }
}

function interview(index: number): TodayInterviewItem {
  return {
    id: `interview-${index}`,
    applicationId: `application-${index % 500}`,
    companyName: `Company ${index % 500}`,
    jobTitle: 'AI Agent Engineer',
    round: index % 2 === 0 ? '一面' : '二面',
    scheduledAt: new Date(2026, 8, 28 + (index % 5), 9 + (index % 8), 0).toISOString(),
    format: '线上视频',
    result: '待面'
  }
}

function event(index: number): TodayEventItem {
  return {
    id: `event-${index}`,
    applicationId: `application-${index % 500}`,
    companyName: `Company ${index % 500}`,
    jobTitle: 'AI Agent Engineer',
    eventType: 'STATUS_CHANGED',
    title: '状态更新',
    description: null,
    createdAt: new Date(2026, 8, 28, 8, index % 60).toISOString()
  }
}

describe('stage 14 performance baselines', () => {
  it('filters 500 applications within the 100ms interaction budget', () => {
    const items = Array.from({ length: 500 }, (_, index) => application(index))
    const filters: ApplicationFilters = {
      search: 'agent',
      status: '',
      direction: '',
      recruitmentType: '',
      priority: '',
      channel: '',
      quick: 'all',
      sort: 'updatedAt'
    }

    const startedAt = performance.now()
    const result = filterAndSortApplications(items, filters, new Date(2026, 8, 28))
    const elapsed = performance.now() - startedAt

    expect(result.length).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(100)
  })

  it('builds Today data from 500 applications, 1000 interviews and 5000 events under 1s', () => {
    const applications = Array.from({ length: 500 }, (_, index) => application(index))
    const interviews = Array.from({ length: 1000 }, (_, index) => interview(index))
    const events = Array.from({ length: 5000 }, (_, index) => event(index))

    const startedAt = performance.now()
    const dashboard = buildTodayDashboard(
      applications,
      interviews,
      events,
      new Date(2026, 8, 28, 8, 0)
    )
    const elapsed = performance.now() - startedAt

    expect(dashboard.counts.totalApplications).toBe(500)
    expect(dashboard.recentEvents).toHaveLength(10)
    expect(elapsed).toBeLessThan(1000)
  })

  it('loads 500 persisted applications from SQLite under 1s', () => {
    const directory = mkdtempSync(join(tmpdir(), 'jobflow-performance-'))
    tempDirs.push(directory)
    const context = createDatabase(join(directory, 'test.db'))

    runInTransaction(context.db, (transactionDb) => {
      const companies = new CompanyRepository(transactionDb)
      const applications = new ApplicationRepository(transactionDb)
      for (let index = 0; index < 500; index += 1) {
        const company = companies.create({ name: `Company ${index}` })
        applications.create({
          companyId: company.id,
          jobTitle: `Role ${index}`,
          direction: index % 2 === 0 ? 'AI Agent' : 'RAG/检索',
          status: index % 3 === 0 ? '面试中' : '已投递'
        })
      }
    })

    const startedAt = performance.now()
    const rows = new ApplicationRepository(context.db).listWithCompany()
    const elapsed = performance.now() - startedAt

    expect(rows).toHaveLength(500)
    expect(elapsed).toBeLessThan(1000)
    context.sqlite.close()
  })
})
