// Cargo unit engine. Mass (kg), volume (L) and count are kept strictly separate.
export const MASS_KG = { g: 0.001, kg: 1, q: 100, t: 1000 } as const
export const VOL_L = { mL: 0.001, L: 1, kL: 1000, m3: 1000 } as const
export type MassUnit = keyof typeof MASS_KG
export type VolUnit = keyof typeof VOL_L

const r = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d
export const toKg = (v: number, u: MassUnit) => r(v * MASS_KG[u])
export const toLitres = (v: number, u: VolUnit) => r(v * VOL_L[u])

/** Mass of a liquid. Returns null unless a valid density (kg/L) is supplied. */
export function liquidMassKg(litres: number, densityKgPerL?: number) {
  if (!densityKgPerL || densityKgPerL <= 0) return null
  return r(litres * densityKgPerL)
}

export function bottled(sizeValue: number, sizeUnit: 'mL' | 'L', bottles: number, perCarton: number) {
  const volumeL = r(toLitres(sizeValue, sizeUnit) * bottles)
  const cartons = perCarton > 0 ? Math.ceil(bottles / perCarton) : 0
  return { volumeL, cartons }
}

export function packets(size: number, unit: MassUnit | VolUnit, count: number, perBox: number) {
  const isMass = unit in MASS_KG
  const total = isMass ? toKg(size * count, unit as MassUnit) : toLitres(size * count, unit as VolUnit)
  return { netKg: isMass ? total : null, netLitres: isMass ? null : total, boxes: perBox > 0 ? Math.ceil(count / perBox) : 0 }
}

export function boxes(lCm: number, wCm: number, hCm: number, count: number, perPallet: number) {
  const volumeM3 = r((lCm * wCm * hCm * count) / 1_000_000)
  return { volumeM3, pallets: perPallet > 0 ? Math.ceil(count / perPallet) : 0 }
}

export const CAPACITIES = {
  'Truck (18 t)': { kg: 18000, m3: 40 },
  'Container 20ft': { kg: 28000, m3: 33 },
  'Container 40ft': { kg: 26500, m3: 67 },
  'Air ULD': { kg: 4500, m3: 15 },
  'Bulk vessel hold': { kg: 5_000_000, m3: 6000 },
} as const
export type Capacity = keyof typeof CAPACITIES

export function checkCapacity(cap: Capacity, massKg: number | null, volumeM3: number | null) {
  const c = CAPACITIES[cap]
  const issues: string[] = []
  if (massKg != null && massKg > c.kg) issues.push(`Weight ${massKg} kg exceeds ${cap} limit of ${c.kg} kg`)
  if (volumeM3 != null && volumeM3 > c.m3) issues.push(`Volume ${volumeM3} m³ exceeds ${cap} limit of ${c.m3} m³`)
  return { ok: issues.length === 0, issues }
}
