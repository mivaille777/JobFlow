import { join } from 'node:path'
import {
  ApplicationRepository,
  CompanyRepository,
  EventRepository,
  InterviewRepository,
  createDatabase
} from '../electron/main/db'

const databasePath = process.env.JOBFLOW_DEV_DB ?? join(process.cwd(), 'jobflow.dev.db')
const context = createDatabase(databasePath)

const companies = new CompanyRepository(context.db)
const applications = new ApplicationRepository(context.db)
const events = new EventRepository(context.db)
const interviews = new InterviewRepository(context.db)

const samples = [
  ['字节跳动', 'AI Agent Engineer', 'AI Agent', 'S', '面试中'],
  ['vivo', '大模型算法工程师', 'LLM算法', 'S', '测评/笔试'],
  ['腾讯', 'AI应用开发工程师', 'AI应用开发', 'A', '已投递'],
  ['美团', '智能体研发工程师', 'AI Agent', 'A', '已投递'],
  ['百度', 'RAG算法工程师', 'RAG/检索', 'A', '待投递'],
  ['阿里巴巴', 'LLM应用工程师', 'LLM算法', 'A', '面试中'],
  ['小米', 'AI平台工程师', 'AI应用开发', 'B', '已投递'],
  ['华为', 'AI算法工程师', 'LLM算法', 'S', '测评/笔试'],
  ['快手', 'Agent研发工程师', 'AI Agent', 'A', '待投递'],
  ['蚂蚁集团', '智能应用研发工程师', 'AI应用开发', 'A', '已投递']
] as const

for (const [companyName, jobTitle, direction, priority, status] of samples) {
  const company = companies.create({ name: companyName })
  const application = applications.create({
    companyId: company.id,
    jobTitle,
    direction,
    priority,
    status,
    applicationDate: new Date().toISOString().slice(0, 10)
  })

  events.create({
    applicationId: application.id,
    eventType: 'CREATED',
    title: '创建岗位'
  })

  if (status === '面试中') {
    interviews.create({
      applicationId: application.id,
      round: '一面',
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      format: '线上视频',
      result: '待面'
    })
  }
}

context.sqlite.close()
console.log(`Seeded JobFlow database: ${databasePath}`)
