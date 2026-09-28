import { describe, expect, it } from 'vitest'
import { appCommands, filterCommands } from '../src/app/commands'

describe('command palette', () => {
  it('keeps essential desktop commands available', () => {
    expect(appCommands.map((command) => command.id)).toEqual(
      expect.arrayContaining([
        'new-application',
        'today',
        'applications',
        'search-applications',
        'interviews',
        'analytics',
        'settings'
      ])
    )
  })

  it('filters using labels, descriptions and keywords', () => {
    expect(filterCommands('面试').map((command) => command.id)).toContain('interviews')
    expect(filterCommands('kanban').map((command) => command.id)).toContain('applications')
    expect(filterCommands('新增').map((command) => command.id)).toContain('new-application')
  })

  it('returns all commands for an empty query', () => {
    expect(filterCommands('')).toHaveLength(appCommands.length)
  })
})
