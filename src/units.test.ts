import { describe, it, expect } from 'vitest'
import { toKg, toLitres, liquidMassKg, bottled, packets, boxes, checkCapacity } from './units'

describe('mass conversions', () => {
  it('quintal and tonne', () => {
    expect(toKg(1, 'q')).toBe(100)
    expect(toKg(1, 't')).toBe(1000)
    expect(toKg(50, 'q')).toBe(5000)
    expect(toKg(1, 't') / toKg(1, 'q')).toBe(10)
  })
})
describe('liquids', () => {
  it('converts volume units', () => { expect(toLitres(2, 'kL')).toBe(2000); expect(toLitres(1, 'm3')).toBe(1000) })
  it('never converts litres to kg without density', () => {
    expect(liquidMassKg(1000)).toBeNull()
    expect(liquidMassKg(1000, 0)).toBeNull()
    expect(liquidMassKg(1000, 0.92)).toBe(920)
  })
})
describe('packaging', () => {
  it('bottled water', () => { expect(bottled(1, 'L', 2400, 24)).toEqual({ volumeL: 2400, cartons: 100 }) })
  it('500 mL bottles', () => { expect(bottled(500, 'mL', 1000, 12)).toEqual({ volumeL: 500, cartons: 84 }) })
  it('rice packets', () => { expect(packets(5, 'kg', 1000, 20).netKg).toBe(5000) })
  it('liquid packets are volume, not mass', () => { const p = packets(1, 'L', 100, 10); expect(p.netKg).toBeNull(); expect(p.netLitres).toBe(100) })
  it('box volume and pallets', () => { expect(boxes(50, 40, 30, 200, 48)).toEqual({ volumeM3: 12, pallets: 5 }) })
})
describe('capacity', () => {
  it('passes within limits', () => { expect(checkCapacity('Truck (18 t)', 10000, 20).ok).toBe(true) })
  it('fails on weight and volume', () => { expect(checkCapacity('Air ULD', 9000, 30).issues.length).toBe(2) })
})
