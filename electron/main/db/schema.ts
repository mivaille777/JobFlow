import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable(
  'companies',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    website: text('website'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [index('companies_name_idx').on(table.name)]
)

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    companyId: text('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    jobTitle: text('job_title').notNull(),
    direction: text('direction'),
    location: text('location'),
    priority: text('priority').notNull().default('A'),
    status: text('status').notNull().default('待投递'),
    stage: text('stage'),
    batch: text('batch'),
    jobUrl: text('job_url'),
    jobId: text('job_id'),
    channel: text('channel'),
    referral: text('referral'),
    resumeVersion: text('resume_version'),
    applicationDate: text('application_date'),
    nextAction: text('next_action'),
    nextActionDate: text('next_action_date'),
    lastProgressAt: text('last_progress_at'),
    finalResult: text('final_result'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    index('applications_company_idx').on(table.companyId),
    index('applications_status_idx').on(table.status),
    index('applications_next_action_date_idx').on(table.nextActionDate)
  ]
)

export const applicationEvents = sqliteTable(
  'application_events',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: text('created_at').notNull()
  },
  (table) => [
    index('application_events_application_idx').on(table.applicationId),
    index('application_events_created_at_idx').on(table.createdAt)
  ]
)

export const interviews = sqliteTable(
  'interviews',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    round: text('round').notNull(),
    scheduledAt: text('scheduled_at').notNull(),
    format: text('format'),
    interviewer: text('interviewer'),
    department: text('department'),
    durationMinutes: integer('duration_minutes'),
    result: text('result'),
    mainQuestions: text('main_questions'),
    codingQuestions: text('coding_questions'),
    projectQuestions: text('project_questions'),
    selfRating: integer('self_rating'),
    improvements: text('improvements'),
    nextRoundFocus: text('next_round_focus'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    index('interviews_application_idx').on(table.applicationId),
    index('interviews_scheduled_at_idx').on(table.scheduledAt)
  ]
)

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const schema = {
  companies,
  applications,
  applicationEvents,
  interviews,
  settings
}
