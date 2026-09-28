import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase } from '../electron/main/db'
import { SettingsService } from '../electron/main/services/settings'
import {
  defaultApplicationChannels,
  defaultJobDirections
} from '../src/shared/settings'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function createService() {
  const directory = mkdtempSync(join(tmpdir(), 'jobflow-settings-'))
  directories.push(directory)
  const databasePath = join(directory, 'jobflow.db')
  const context = createDatabase(databasePath)
  return {
    context,
    service: new SettingsService(context.db, databasePath),
    databasePath
  }
}

describe('settings service', () => {
  it('returns practical defaults', () => {
    const { context, service, databasePath } = createService()
    expect(service.get()).toEqual({
      theme: 'system',
      defaultPriority: 'A',
      directions: [...defaultJobDirections],
      channels: [...defaultApplicationChannels],
      databasePath
    })
    context.sqlite.close()
  })

  it('persists appearance, default priority and normalized directions', () => {
    const { context, service } = createService()

    const updated = service.update({
      theme: 'dark',
      defaultPriority: 'S',
      directions: ['AI Agent', ' RAG/检索 ', 'AI Agent'],
      channels: ['官网', ' 内推 ', '官网']
    })

    expect(updated).toMatchObject({
      theme: 'dark',
      defaultPriority: 'S',
      directions: ['AI Agent', 'RAG/检索'],
      channels: ['官网', '内推']
    })

    const reopened = new SettingsService(context.db, 'another-path')
    expect(reopened.get()).toMatchObject({
      theme: 'dark',
      defaultPriority: 'S',
      directions: ['AI Agent', 'RAG/检索'],
      channels: ['官网', '内推']
    })

    context.sqlite.close()
  })

  it('rejects empty option lists', () => {
    const { context, service } = createService()
    expect(() => service.update({ directions: [] })).toThrow()
    expect(() => service.update({ channels: [] })).toThrow()
    context.sqlite.close()
  })
})
