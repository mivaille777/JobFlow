import type { DatabaseSync } from 'node:sqlite'

interface Migration {
  version: number
  name: string
  sql: string
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      CREATE TABLE companies (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        website TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX companies_name_idx ON companies(name);

      CREATE TABLE applications (
        id TEXT PRIMARY KEY NOT NULL,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        job_title TEXT NOT NULL,
        direction TEXT,
        location TEXT,
        priority TEXT NOT NULL DEFAULT 'A',
        status TEXT NOT NULL DEFAULT '待投递',
        stage TEXT,
        job_url TEXT,
        job_id TEXT,
        channel TEXT,
        referral TEXT,
        resume_version TEXT,
        application_date TEXT,
        next_action TEXT,
        next_action_date TEXT,
        last_progress_at TEXT,
        final_result TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX applications_company_idx ON applications(company_id);
      CREATE INDEX applications_status_idx ON applications(status);
      CREATE INDEX applications_next_action_date_idx ON applications(next_action_date);

      CREATE TABLE application_events (
        id TEXT PRIMARY KEY NOT NULL,
        application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX application_events_application_idx ON application_events(application_id);
      CREATE INDEX application_events_created_at_idx ON application_events(created_at);

      CREATE TABLE interviews (
        id TEXT PRIMARY KEY NOT NULL,
        application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        round TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        format TEXT,
        interviewer TEXT,
        department TEXT,
        duration_minutes INTEGER,
        result TEXT,
        main_questions TEXT,
        coding_questions TEXT,
        project_questions TEXT,
        self_rating INTEGER,
        improvements TEXT,
        next_round_focus TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX interviews_application_idx ON interviews(application_id);
      CREATE INDEX interviews_scheduled_at_idx ON interviews(scheduled_at);

      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `
  },
  {
    version: 2,
    name: 'add_application_batch',
    sql: `
      ALTER TABLE applications ADD COLUMN batch TEXT;
    `
  }
]

export function applyMigrations(sqlite: DatabaseSync): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const rows = sqlite
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as Array<{ version: number }>
  const applied = new Set(rows.map((row) => row.version))

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue

    sqlite.exec('BEGIN IMMEDIATE')
    try {
      sqlite.exec(migration.sql)
      sqlite
        .prepare(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
        )
        .run(migration.version, migration.name, new Date().toISOString())
      sqlite.exec('COMMIT')
    } catch (error) {
      sqlite.exec('ROLLBACK')
      throw error
    }
  }
}
