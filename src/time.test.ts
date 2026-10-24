import { describe, it, expect } from 'vitest'
import { zonedToUtc } from './time'
describe('time zones', () => {
  it('Kolkata is UTC+5:30', () => expect(zonedToUtc('2026-01-01T12:00', 'Asia/Kolkata').toISOString()).toBe('2026-01-01T06:30:00.000Z'))
  it('New York observes DST', () => {
    expect(zonedToUtc('2026-07-01T12:00', 'America/New_York').toISOString()).toBe('2026-07-01T16:00:00.000Z')
    expect(zonedToUtc('2026-01-01T12:00', 'America/New_York').toISOString()).toBe('2026-01-01T17:00:00.000Z')
  })
  it('Rotterdam summer time', () => expect(zonedToUtc('2026-07-01T12:00', 'Europe/Amsterdam').toISOString()).toBe('2026-07-01T10:00:00.000Z'))
})
