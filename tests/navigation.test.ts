import { describe, expect, it } from 'vitest'
import { navigationItems } from '../src/app/navigation'

describe('navigation', () => {
  it('keeps the V1 workspace intentionally small', () => {
    expect(navigationItems.map((item) => item.path)).toEqual([
      '/',
      '/applications',
      '/interviews',
      '/analytics',
      '/settings'
    ])
  })

  it('has unique routes', () => {
    const paths = navigationItems.map((item) => item.path)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
