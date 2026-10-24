import { toKg, toLitres, liquidMassKg, bottled, packets, boxes, MassUnit, VolUnit } from './units'

export type Tab = 'dashboard' | 'add' | 'cargo' | 'track' | 'ops' | 'clock'
export type Role = { id: string; name: string; desc: string; tabs: Tab[]; add: boolean; ops: boolean }
const ALL: Tab[] = ['dashboard', 'add', 'cargo', 'track', 'ops', 'clock']
const V: Tab[] = ['dashboard', 'cargo', 'track', 'clock']
export const ROLES: Role[] = [
  { id: 'admin', name: 'Super Administrator', desc: 'Platform-wide control', tabs: ALL, add: true, ops: true },
  { id: 'owner', name: 'Logistics Company Owner', desc: 'Company performance', tabs: ['dashboard', 'add', 'cargo', 'track', 'clock'], add: true, ops: false },
  { id: 'road', name: 'Road Transport & Dispatch', desc: 'Trucks and dispatch', tabs: ['dashboard', 'add', 'cargo', 'track', 'clock'], add: true, ops: false },
  { id: 'shipping', name: 'Shipping Company', desc: 'Vessels and bookings', tabs: ['dashboard', 'add', 'cargo', 'track', 'clock'], add: true, ops: false },
  { id: 'portmgr', name: 'Port Operations Manager', desc: 'Terminal oversight', tabs: ALL, add: true, ops: true },
  { id: 'portstaff', name: 'Port Ground Staff', desc: 'Receive, load, unload, hand over', tabs: ['dashboard', 'cargo', 'track', 'ops', 'clock'], add: false, ops: true },
  { id: 'air', name: 'Air Cargo Company', desc: 'Flights and air freight', tabs: ['dashboard', 'add', 'cargo', 'track', 'clock'], add: true, ops: false },
  { id: 'airstaff', name: 'Airport Ground Staff', desc: 'Ramp and cargo handling', tabs: ['dashboard', 'cargo', 'track', 'ops', 'clock'], add: false, ops: true },
  { id: 'airsup', name: 'Airport Cargo Supervisor', desc: 'Terminal supervision', tabs: ALL, add: true, ops: true },
  { id: 'warehouse', name: 'Warehouse Staff', desc: 'Storage and transfers', tabs: ['dashboard', 'cargo', 'track', 'ops', 'clock'], add: false, ops: true },
  { id: 'driver', name: 'Driver', desc: 'Pickups and deliveries', tabs: V, add: false, ops: false },
  { id: 'customer', name: 'Customer & Business Client', desc: 'Book and track cargo', tabs: ['dashboard', 'add', 'cargo', 'track', 'clock'], add: true, ops: false },
]

export const CATEGORIES = [
  ['solid', 'Solid goods'], ['liquid', 'Liquid goods'], ['bottled', 'Bottled products'], ['packaged', 'Packets & packaged goods'],
  ['boxes', 'Boxes, cartons & pallets'], ['machinery', 'Machinery & oversized'], ['bulk', 'Bulk & agricultural'], ['custom', 'Custom cargo'],
] as const
export type Cat = typeof CATEGORIES[number][0]
export const STATUSES = ['Draft', 'Booked', 'Received', 'Awaiting verification', 'Loaded', 'In transit', 'Unloaded', 'Delivered', 'Damaged']
export const MODES = ['Road', 'Ship', 'Air', 'Rail', 'Multimodal']

type F = { k: string; label: string; opts?: string[]; def?: string; opt?: boolean }
const ITEM = ['pieces', 'bags', 'boxes', 'cartons', 'pallets', 'crates', 'bundles', 'containers']
export const FIELDS: Record<Cat, F[]> = {
  solid: [{ k: 'w', label: 'Weight' }, { k: 'wu', label: 'Weight unit', opts: ['g', 'kg', 'q', 't'], def: 'kg' }, { k: 'n', label: 'Item count', opt: true }, { k: 'nu', label: 'Counted in', opts: ITEM, def: 'pieces' }],
  liquid: [{ k: 'v', label: 'Volume' }, { k: 'vu', label: 'Volume unit', opts: ['mL', 'L', 'kL', 'm3'], def: 'L' }, { k: 'n', label: 'Containers', opt: true }, { k: 'nu', label: 'Container type', opts: ['bottles', 'cans', 'drums', 'barrels', 'tanks', 'containers'], def: 'drums' }, { k: 'd', label: 'Density kg/L (needed for mass)', opt: true }],
  bottled: [{ k: 'sz', label: 'Bottle size' }, { k: 'su', label: 'Size unit', opts: ['mL', 'L'], def: 'L' }, { k: 'n', label: 'Number of bottles' }, { k: 'pc', label: 'Bottles per carton' }, { k: 'gw', label: 'Gross weight kg', opt: true }],
  packaged: [{ k: 'sz', label: 'Packet size' }, { k: 'su', label: 'Size unit', opts: ['g', 'kg', 'mL', 'L'], def: 'kg' }, { k: 'n', label: 'Number of packets' }, { k: 'pb', label: 'Packets per box' }, { k: 'gw', label: 'Gross weight kg', opt: true }],
  boxes: [{ k: 'l', label: 'Box length cm' }, { k: 'wd', label: 'Box width cm' }, { k: 'h', label: 'Box height cm' }, { k: 'n', label: 'Number of boxes' }, { k: 'pp', label: 'Boxes per pallet' }, { k: 'gw', label: 'Gross weight kg' }],
  machinery: [{ k: 'n', label: 'Number of machines' }, { k: 'uw', label: 'Weight per unit kg' }, { k: 'l', label: 'Length m' }, { k: 'wd', label: 'Width m' }, { k: 'h', label: 'Height m' }, { k: 'rq', label: 'Handling / equipment', opts: ['Standard', 'Crane lift', 'Forklift', 'Fragile - special handling'], def: 'Standard' }],
  bulk: [{ k: 'w', label: 'Weight' }, { k: 'wu', label: 'Weight unit', opts: ['kg', 'q', 't'], def: 't' }, { k: 'vm', label: 'Volume m³', opt: true }, { k: 'n', label: 'Bags (if packaged)', opt: true }, { k: 'rq', label: 'Loading method', opts: ['Conveyor', 'Grab / crane', 'Pump', 'Manual'], def: 'Conveyor' }],
  custom: [{ k: 'uname', label: 'Unit name (e.g. rolls)' }, { k: 'n', label: 'Quantity' }, { k: 'gw', label: 'Gross weight kg', opt: true }],
}

export type Calc = { massKg: number | null; volumeM3: number | null; count: number; qty: string; packaging: string; lines: string[]; errors: string[] }
export function compute(cat: Cat, f: Record<string, string>): Calc {
  const x = (k: string) => parseFloat(f[k] || '') || 0
  const errors: string[] = []; const lines: string[] = []
  for (const fl of FIELDS[cat]) if (!fl.opts && !fl.opt && !(x(fl.k) > 0) && fl.k !== 'uname') errors.push(`${fl.label} must be greater than 0`)
  if (cat === 'custom' && !f.uname) errors.push('Unit name is required')
  let massKg: number | null = null, volL: number | null = null, volM3: number | null = null, count = 0, qty = '', packaging = ''
  if (cat === 'solid' || cat === 'bulk') {
    massKg = toKg(x('w'), (f.wu || 'kg') as MassUnit); count = x('n'); qty = `${x('w')} ${f.wu} (${x('n') ? x('n') + ' ' + (cat === 'solid' ? f.nu : 'bags') : 'weight only'})`
    packaging = cat === 'solid' ? f.nu || '' : f.rq || ''; lines.push(`Total mass: ${massKg} kg (${massKg / 1000} t, ${massKg / 100} q)`)
    if (cat === 'bulk' && x('vm')) { volM3 = x('vm'); lines.push(`Bulk volume: ${volM3} m³ (not converted to mass)`) }
  } else if (cat === 'liquid') {
    volL = toLitres(x('v'), (f.vu || 'L') as VolUnit); count = x('n'); qty = `${x('v')} ${f.vu}${x('n') ? `, ${x('n')} ${f.nu}` : ''}`; packaging = f.nu || ''
    lines.push(`Volume: ${volL} L (${volL / 1000} kL)`)
    const m = liquidMassKg(volL, x('d')); massKg = m
    lines.push(m == null ? 'Mass: unknown. Litres are volume; enter a density to get kilograms.' : `Mass at ${x('d')} kg/L: ${m} kg`)
  } else if (cat === 'bottled') {
    const b = bottled(x('sz'), (f.su || 'L') as 'mL' | 'L', x('n'), x('pc')); volL = b.volumeL; count = x('n'); qty = `${x('n')} bottles of ${x('sz')} ${f.su}`; packaging = `${b.cartons} cartons`
    massKg = x('gw') || null; lines.push(`Nominal liquid volume: ${b.volumeL} L`, `Cartons: ${b.cartons} (${x('pc')} per carton)`, massKg ? `Gross shipping weight: ${massKg} kg (separate from liquid volume)` : 'Gross weight not entered')
  } else if (cat === 'packaged') {
    const p = packets(x('sz'), (f.su || 'kg') as MassUnit | VolUnit, x('n'), x('pb')); count = x('n'); qty = `${x('n')} packets of ${x('sz')} ${f.su}`; packaging = `${p.boxes} boxes`
    if (p.netKg != null) lines.push(`Net product weight: ${p.netKg} kg (${p.netKg / 1000} t)`); else { volL = p.netLitres; lines.push(`Net product volume: ${p.netLitres} L`) }
    massKg = x('gw') || null; lines.push(`Boxes: ${p.boxes}`, massKg ? `Gross shipping weight: ${massKg} kg` : 'Gross weight not entered')
  } else if (cat === 'boxes') {
    const b = boxes(x('l'), x('wd'), x('h'), x('n'), x('pp')); count = x('n'); massKg = x('gw') || null; volM3 = b.volumeM3; qty = `${x('n')} boxes`; packaging = `${b.pallets} pallets`
    lines.push(`Total volume: ${b.volumeM3} m³`, `Pallets: ${b.pallets}`, `Gross weight: ${massKg ?? 0} kg`)
  } else if (cat === 'machinery') {
    count = x('n'); massKg = toKg(x('n') * x('uw'), 'kg'); volM3 = Math.round(x('n') * x('l') * x('wd') * x('h') * 1000) / 1000; qty = `${x('n')} machines`; packaging = f.rq || ''
    lines.push(`Total weight: ${massKg} kg`, `Total volume: ${volM3} m³`, `Handling: ${f.rq}`)
  } else {
    count = x('n'); qty = `${x('n')} ${f.uname || 'units'}`; massKg = x('gw') || null; packaging = f.uname || ''; lines.push(`Quantity: ${qty}`)
  }
  if (volL != null && volM3 == null) volM3 = Math.round(volL) / 1000
  if (volL != null && volM3 != null && volL / 1000 !== volM3) volM3 = volL / 1000
  return { massKg, volumeM3: volM3, count, qty, packaging, lines, errors }
}

export type Cargo = { id: string; shipmentId: string; product: string; category: Cat; qty: string; count: number; massKg: number | null; volumeM3: number | null; packaging: string; origin: string; destination: string; mode: string; dept: string; location: string; status: string; updated: string }
export type Ev = { id: string; shipmentId: string; kind: 'event' | 'handover' | 'incident'; title: string; place: string; tz: string; at: string; from?: string; to?: string; toRole?: string; confirmed?: boolean; cargoId?: string }
export type Task = { id: string; title: string; shipmentId: string; priority: 'High' | 'Normal'; due: string; status: 'Pending' | 'In progress' | 'Done' }
const d = (h: number) => new Date(Date.now() - h * 3600000).toISOString()
export const SEED_CARGO: Cargo[] = [
  { id: 'CG-DEMO1', shipmentId: 'SHP-1001', product: 'Basmati rice', category: 'solid', qty: '50 q (500 bags)', count: 500, massKg: 5000, volumeM3: null, packaging: 'bags', origin: 'Chennai, IN', destination: 'Rotterdam, NL', mode: 'Multimodal', dept: 'Port Ground Staff', location: 'Chennai Port, Terminal 2', status: 'Awaiting verification', updated: d(2) },
  { id: 'CG-DEMO2', shipmentId: 'SHP-1002', product: 'Drinking water 1 L', category: 'bottled', qty: '2400 bottles of 1 L', count: 2400, massKg: 2520, volumeM3: 2.4, packaging: '100 cartons', origin: 'Bengaluru, IN', destination: 'Dubai, AE', mode: 'Air', dept: 'Airport Ground Staff', location: 'BLR Cargo Terminal', status: 'In transit', updated: d(6) },
  { id: 'CG-DEMO3', shipmentId: 'SHP-1003', product: 'CNC machines', category: 'machinery', qty: '3 machines', count: 3, massKg: 7500, volumeM3: 18, packaging: 'Crane lift', origin: 'Pune, IN', destination: 'Singapore, SG', mode: 'Ship', dept: 'Shipping Company', location: 'Mumbai Port', status: 'Loaded', updated: d(20) },
]
export const SEED_EVENTS: Ev[] = [
  { id: 'e1', shipmentId: 'SHP-1001', kind: 'event', title: 'Picked up from factory by truck', place: 'Chennai factory', tz: 'Asia/Kolkata', at: d(30) },
  { id: 'e2', shipmentId: 'SHP-1001', kind: 'handover', title: 'Truck to Port Ground Staff', place: 'Chennai Port', tz: 'Asia/Kolkata', at: d(2), from: 'Truck driver', to: 'Port Ground Staff', toRole: 'portstaff', confirmed: true, cargoId: 'CG-DEMO1' },
  { id: 'e3', shipmentId: 'SHP-1001', kind: 'event', title: 'Vessel departure scheduled', place: 'Chennai Port', tz: 'Asia/Kolkata', at: new Date(Date.now() + 36 * 3600000).toISOString() },
  { id: 'e4', shipmentId: 'SHP-1001', kind: 'event', title: 'Estimated arrival', place: 'Rotterdam Port', tz: 'Europe/Amsterdam', at: new Date(Date.now() + 22 * 86400000).toISOString() },
  { id: 'e5', shipmentId: 'SHP-1002', kind: 'event', title: 'Flight departed', place: 'BLR Airport', tz: 'Asia/Kolkata', at: d(5) },
]
export const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Verify 500 rice bags, Terminal 2', shipmentId: 'SHP-1001', priority: 'High', due: '14:00', status: 'Pending' },
  { id: 't2', title: 'Load 3 CNC machines onto vessel MV Aurora', shipmentId: 'SHP-1003', priority: 'High', due: '16:30', status: 'In progress' },
  { id: 't3', title: 'Transfer pallets to Warehouse B', shipmentId: 'SHP-1004', priority: 'Normal', due: '18:00', status: 'Pending' },
]
