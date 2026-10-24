import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { LayoutDashboard, PackagePlus, Boxes, Route, Anchor, Globe2, LogOut, Download, X, Check, Menu } from 'lucide-react'
import { ROLES, Role, Tab, CATEGORIES, Cat, FIELDS, compute, STATUSES, MODES, Cargo, Ev, Task, SEED_CARGO, SEED_EVENTS, SEED_TASKS } from './data'
import { CAPACITIES, Capacity, checkCapacity } from './units'
import { zonedToUtc, fmtLocal, fmtClock, allZones } from './time'

function useLS<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => { try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : init } catch { return init } })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* storage unavailable */ } }, [key, v])
  return [v, setV] as const
}
const uid = (p: string) => p + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 99)
const STATUS_COLOR: Record<string, string> = { Draft: '#94a3b8', Booked: '#60a5fa', Received: '#22d3ee', 'Awaiting verification': '#fbbf24', Loaded: '#a78bfa', 'In transit': '#d946ef', Unloaded: '#2dd4bf', Delivered: '#34d399', Damaged: '#f87171' }
const Badge = ({ s }: { s: string }) => <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: STATUS_COLOR[s] + '26', color: STATUS_COLOR[s], border: `1px solid ${STATUS_COLOR[s]}66` }}>{s}</span>
const Sel = ({ value, onChange, opts, label }: { value: string; onChange: (v: string) => void; opts: string[]; label: string }) => (
  <div><label className="lbl">{label}<select className="inp mt-1" value={value} onChange={e => onChange(e.target.value)}>{opts.map(o => <option key={o}>{o}</option>)}</select></label></div>)

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [cargo, setCargo] = useLS<Cargo[]>('lsg_cargo', SEED_CARGO)
  const [events, setEvents] = useLS<Ev[]>('lsg_events', SEED_EVENTS)
  const [tasks, setTasks] = useLS<Task[]>('lsg_tasks', SEED_TASKS)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [nav, setNav] = useState(false)
  if (!role) return <Login onPick={r => { setRole(r); setTab('dashboard') }} />
  const names: Record<Tab, [string, JSX.Element]> = {
    dashboard: ['Dashboard', <LayoutDashboard size={18} />], add: ['Add new cargo', <PackagePlus size={18} />], cargo: ['Cargo', <Boxes size={18} />],
    track: ['Shipment tracking', <Route size={18} />], ops: [role.id.startsWith('air') ? 'Airport operations' : 'Port operations', <Anchor size={18} />], clock: ['World clock', <Globe2 size={18} />] }
  const log = (e: Omit<Ev, 'id'>) => setEvents(p => [{ ...e, id: uid('e') }, ...p])
  return (
    <div className="flex min-h-screen">
      <aside className={`${nav ? 'flex' : 'hidden'} md:flex fixed md:sticky top-0 z-30 h-screen w-60 shrink-0 flex-col gap-1 p-3 glass rounded-none`}>
        <div className="mb-3 px-2 text-lg font-bold bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">LogiSphere Global</div>
        {role.tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setNav(false) }} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${tab === t ? 'bg-violet-500/25 text-white' : 'text-slate-300 hover:bg-white/5'}`}>{names[t][1]}{names[t][0]}</button>))}
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs"><div className="font-semibold">{role.name}</div><div className="text-slate-400">{role.desc}</div>
          <button className="btn btn-ghost mt-2 w-full justify-center" onClick={() => setRole(null)}><LogOut size={14} />Switch portal</button></div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3"><button aria-label="Toggle menu" className="btn btn-ghost md:hidden" onClick={() => setNav(!nav)}><Menu size={18} /></button>
          <h1 className="text-2xl font-bold">{names[tab][0]}</h1><span className="ml-auto text-xs text-slate-400">Demo data stored in this browser</span></div>
        {tab === 'dashboard' && <Dashboard role={role} cargo={cargo} tasks={tasks} events={events} />}
        {tab === 'add' && <AddCargo role={role} onSave={(c, ev) => { setCargo(p => [c, ...p]); log(ev); setTab('cargo') }} />}
        {tab === 'cargo' && <CargoTable cargo={cargo} />}
        {tab === 'track' && <Tracking events={events} cargo={cargo} />}
        {tab === 'ops' && role.ops && <Ops role={role} cargo={cargo} setCargo={setCargo} events={events} setEvents={setEvents} tasks={tasks} setTasks={setTasks} log={log} />}
        {tab === 'clock' && <Clock />}
      </main>
    </div>)
}

function Login({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="rim mb-8"><div className="glass p-8"><h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">LogiSphere Global</h1>
        <p className="mt-2 max-w-xl text-slate-300">Road, sea and air cargo on one shipment ID. Choose your portal to sign in.</p>
        <p className="mt-2 text-xs text-amber-300">Demo build: portals open without a password and data stays in your browser. Real authentication belongs to the FastAPI backend stage.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ROLES.map(r => (
        <button key={r.id} onClick={() => onPick(r)} className={`glass p-4 text-left hover:border-cyan-300/60 ${r.id === 'portstaff' ? 'ring-2 ring-cyan-400/60' : ''}`}><div className="font-semibold">{r.name}</div><div className="text-sm text-slate-400">{r.desc}</div></button>))}</div>
    </div>)
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="glass p-4"><div className="text-3xl font-bold">{value}</div><div className="text-sm text-slate-400">{label}</div></div> }

function Dashboard({ role, cargo, tasks, events }: { role: Role; cargo: Cargo[]; tasks: Task[]; events: Ev[] }) {
  const by = STATUSES.map(s => [s, cargo.filter(c => c.status === s).length] as const)
  const max = Math.max(1, ...by.map(b => b[1]))
  const pend = events.filter(e => e.kind === 'handover' && !e.confirmed).length
  const stf = role.id === 'portstaff'
  return (
    <div className="space-y-4">
      {stf && <div className="glass grid gap-2 p-4 text-sm sm:grid-cols-4"><div><div className="text-slate-400">Staff</div>Amit Rao</div><div><div className="text-slate-400">Employee ID</div>PGS-2041</div><div><div className="text-slate-400">Seaport / terminal</div>Chennai Port, Terminal 2</div><div><div className="text-slate-400">Shift</div>Day 06:00-14:00 IST</div></div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total cargo records" value={cargo.length} /><Stat label="In transit" value={cargo.filter(c => c.status === 'In transit').length} />
        <Stat label="Awaiting verification" value={cargo.filter(c => c.status === 'Awaiting verification').length} /><Stat label="Damaged reports" value={cargo.filter(c => c.status === 'Damaged').length} />
        {stf && <><Stat label="Today's tasks" value={tasks.length} /><Stat label="Pending tasks" value={tasks.filter(t => t.status !== 'Done').length} /><Stat label="Pending handovers" value={pend} /><Stat label="Loaded / unloaded" value={cargo.filter(c => c.status === 'Loaded' || c.status === 'Unloaded').length} /></>}
      </div>
      <div className="glass p-4"><h2 className="mb-3 font-semibold">Cargo by status</h2>
        {by.map(([s, n]) => <div key={s} className="mb-2 flex items-center gap-3 text-sm"><span className="w-40 shrink-0 text-slate-300">{s}</span><div className="h-3 flex-1 rounded bg-white/5"><div className="h-3 rounded" style={{ width: `${(n / max) * 100}%`, background: STATUS_COLOR[s] }} /></div><span className="w-6 text-right">{n}</span></div>)}</div>
    </div>)
}

function AddCargo({ role, onSave }: { role: Role; onSave: (c: Cargo, e: Omit<Ev, 'id'>) => void }) {
  const [cat, setCat] = useState<Cat>('solid')
  const init = (c: Cat) => Object.fromEntries(FIELDS[c].filter(f => f.def).map(f => [f.k, f.def!]))
  const [f, setF] = useState<Record<string, string>>(init('solid'))
  const [h, setH] = useState({ shipmentId: '', product: '', origin: '', destination: '', mode: 'Road', cap: 'Truck (18 t)' as Capacity, tz: 'Asia/Kolkata' })
  const [done, setDone] = useState<{ c: Cargo; qr: string } | null>(null)
  const [draft, setDraft] = useState('')
  const calc = useMemo(() => compute(cat, f), [cat, f])
  const cap = checkCapacity(h.cap, calc.massKg, calc.volumeM3)
  const hErr = [!h.product && 'Product name is required', !h.origin && 'Origin is required', !h.destination && 'Destination is required'].filter(Boolean) as string[]
  const errors = [...hErr, ...calc.errors, ...cap.issues]
  if (!role.add) return <div className="glass p-4">Your role cannot add cargo.</div>
  const save = async (status: string) => {
    const c: Cargo = { id: uid('CG-'), shipmentId: h.shipmentId || uid('SHP-'), product: h.product, category: cat, qty: calc.qty, count: calc.count, massKg: calc.massKg, volumeM3: calc.volumeM3, packaging: calc.packaging, origin: h.origin, destination: h.destination, mode: h.mode, dept: role.name, location: h.origin, status, updated: new Date().toISOString() }
    const qr = await QRCode.toDataURL(`${c.id}|${c.shipmentId}`, { margin: 1, width: 200 })
    setDone({ c, qr }); onSave(c, { shipmentId: c.shipmentId, kind: 'event', title: `Cargo ${c.id} ${status === 'Draft' ? 'saved as draft' : 'booked'}`, place: h.origin, tz: h.tz, at: new Date().toISOString(), cargoId: c.id })
  }
  const dup = () => { setDraft('Duplicated: change the product name to create a second item'); setH({ ...h, product: h.product + ' (copy)' }) }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass space-y-4 p-4 lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="lbl">Shipment number (blank creates new)<input className="inp mt-1" value={h.shipmentId} onChange={e => setH({ ...h, shipmentId: e.target.value })} placeholder="SHP-1001" /></label></div>
          <div><label className="lbl">Product name<input className="inp mt-1" value={h.product} onChange={e => setH({ ...h, product: e.target.value })} placeholder="e.g. Basmati rice" /></label></div>
          <div><label className="lbl">Cargo category<select className="inp mt-1" value={cat} onChange={e => { const c = e.target.value as Cat; setCat(c); setF(init(c)) }}>{CATEGORIES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label></div>
          <Sel label="Transport mode" value={h.mode} onChange={v => setH({ ...h, mode: v })} opts={MODES} />
          <div><label className="lbl">Origin<input className="inp mt-1" value={h.origin} onChange={e => setH({ ...h, origin: e.target.value })} placeholder="Chennai, IN" /></label></div>
          <div><label className="lbl">Destination<input className="inp mt-1" value={h.destination} onChange={e => setH({ ...h, destination: e.target.value })} placeholder="Rotterdam, NL" /></label></div>
          <Sel label="Vehicle / container (capacity check)" value={h.cap} onChange={v => setH({ ...h, cap: v as Capacity })} opts={Object.keys(CAPACITIES)} />
          <div><label className="lbl">Origin time zone<select className="inp mt-1" value={h.tz} onChange={e => setH({ ...h, tz: e.target.value })}>{allZones().map(z => <option key={z}>{z}</option>)}</select></label></div>
        </div>
        <div className="border-t border-white/10 pt-3"><h3 className="mb-2 font-semibold">{CATEGORIES.find(c => c[0] === cat)![1]} details</h3>
          <div className="grid gap-3 sm:grid-cols-2">{FIELDS[cat].map(fl => fl.opts
            ? <Sel key={cat + fl.k} label={fl.label} value={f[fl.k] || fl.def || ''} onChange={v => setF({ ...f, [fl.k]: v })} opts={fl.opts} />
            : <div key={cat + fl.k}><label className="lbl">{fl.label}{fl.opt ? ' (optional)' : ''}<input className="inp mt-1" inputMode="decimal" type={fl.k === 'uname' ? 'text' : 'number'} min="0" value={f[fl.k] || ''} onChange={e => setF({ ...f, [fl.k]: e.target.value })} /></label></div>)}</div></div>
        <div className="flex flex-wrap gap-2"><button className="btn" disabled={errors.length > 0} onClick={() => save('Booked')}><Check size={16} />Submit cargo</button>
          <button className="btn btn-ghost" disabled={!h.product} onClick={() => save('Draft')}>Save draft</button><button className="btn btn-ghost" onClick={dup}>Duplicate item</button>
          <button className="btn btn-ghost" onClick={() => { setF(init(cat)); setH({ ...h, product: '' }) }}><X size={16} />Clear item</button></div>
        {draft && <p className="text-xs text-slate-400">{draft}</p>}
      </div>
      <div className="space-y-4">
        <div className="glass p-4"><h3 className="mb-2 font-semibold">Summary before submission</h3>
          <ul className="space-y-1 text-sm text-slate-200">{calc.lines.map(l => <li key={l}>{l}</li>)}{calc.lines.length === 0 && <li className="text-slate-400">Enter quantities to see totals.</li>}</ul>
          {calc.volumeM3 != null && <p className="mt-2 text-sm">Total volume: {calc.volumeM3} m³</p>}</div>
        {errors.length > 0 && <div className="glass border-amber-400/40 p-4 text-sm text-amber-200"><h3 className="mb-1 font-semibold">Fix before submitting</h3><ul className="list-disc pl-4">{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
        {done && <div className="rim"><div className="glass p-4 text-center"><div className="font-semibold text-emerald-300">Saved: {done.c.id}</div><img className="mx-auto my-2 rounded bg-white p-1" src={done.qr} alt={`QR code for ${done.c.id}`} /><div className="text-xs text-slate-400">Shipment {done.c.shipmentId}</div></div></div>}
      </div>
    </div>)
}

function CargoTable({ cargo }: { cargo: Cargo[] }) {
  const [q, setQ] = useState(''); const [cat, setCat] = useState('All'); const [st, setSt] = useState('All'); const [mode, setMode] = useState('All')
  const [from, setFrom] = useState(''); const [sort, setSort] = useState<keyof Cargo>('updated'); const [asc, setAsc] = useState(false); const [page, setPage] = useState(0); const [sel, setSel] = useState<Cargo | null>(null); const [qr, setQr] = useState('')
  const rows = useMemo(() => cargo.filter(c => (cat === 'All' || c.category === cat) && (st === 'All' || c.status === st) && (mode === 'All' || c.mode === mode) && (!from || c.updated >= from) &&
    (JSON.stringify(c).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => { const x = String(a[sort] ?? ''), y = String(b[sort] ?? ''); return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1) }), [cargo, q, cat, st, mode, from, sort, asc])
  const pages = Math.max(1, Math.ceil(rows.length / 8)); const cur = Math.min(page, pages - 1); const view = rows.slice(cur * 8, cur * 8 + 8)
  useEffect(() => { if (sel) QRCode.toDataURL(`${sel.id}|${sel.shipmentId}`, { margin: 1, width: 180 }).then(setQr) }, [sel])
  const exp = () => { const h = ['id', 'shipmentId', 'product', 'category', 'qty', 'massKg', 'volumeM3', 'packaging', 'origin', 'destination', 'mode', 'dept', 'location', 'status', 'updated']
    const csv = [h.join(','), ...rows.map(r => h.map(k => JSON.stringify((r as unknown as Record<string, unknown>)[k] ?? '')).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'cargo.csv'; a.click() }
  const th = (k: keyof Cargo, l: string) => <th className="cursor-pointer whitespace-nowrap p-2 text-left" onClick={() => { setSort(k); setAsc(sort === k ? !asc : true) }}>{l}{sort === k ? (asc ? ' ▲' : ' ▼') : ''}</th>
  return (
    <div className="space-y-3"><div className="glass grid gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6">
      <input className="inp" placeholder="Search anything" aria-label="Search cargo" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
      <select className="inp" aria-label="Category" value={cat} onChange={e => setCat(e.target.value)}><option>All</option>{CATEGORIES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
      <select className="inp" aria-label="Status" value={st} onChange={e => setSt(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      <select className="inp" aria-label="Transport mode" value={mode} onChange={e => setMode(e.target.value)}><option>All</option>{MODES.map(s => <option key={s}>{s}</option>)}</select>
      <input className="inp" type="date" aria-label="Updated since" value={from} onChange={e => setFrom(e.target.value)} />
      <button className="btn btn-ghost justify-center" onClick={exp}><Download size={16} />Export CSV</button></div>
      <div className="glass overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr>{th('id', 'Cargo ID')}{th('shipmentId', 'Shipment')}{th('product', 'Product')}{th('category', 'Category')}<th className="p-2 text-left">Quantity</th>{th('massKg', 'Weight kg')}{th('volumeM3', 'Volume m³')}{th('origin', 'Origin')}{th('destination', 'Destination')}{th('mode', 'Mode')}{th('location', 'Location')}{th('status', 'Status')}{th('updated', 'Updated')}</tr></thead>
        <tbody>{view.map(c => <tr key={c.id} tabIndex={0} className="cursor-pointer border-t border-white/5 hover:bg-white/5" onClick={() => setSel(c)} onKeyDown={e => e.key === 'Enter' && setSel(c)}>
          <td className="p-2">{c.id}</td><td className="p-2">{c.shipmentId}</td><td className="p-2">{c.product}</td><td className="p-2">{c.category}</td><td className="p-2">{c.qty}</td><td className="p-2">{c.massKg ?? '-'}</td><td className="p-2">{c.volumeM3 ?? '-'}</td><td className="p-2">{c.origin}</td><td className="p-2">{c.destination}</td><td className="p-2">{c.mode}</td><td className="p-2">{c.location}</td><td className="p-2"><Badge s={c.status} /></td><td className="p-2 whitespace-nowrap">{new Date(c.updated).toLocaleString()}</td></tr>)}
          {view.length === 0 && <tr><td colSpan={13} className="p-6 text-center text-slate-400">No cargo matches these filters. Clear a filter or add new cargo.</td></tr>}</tbody></table></div>
      <div className="flex items-center gap-3 text-sm"><button className="btn btn-ghost" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button><span>Page {cur + 1} of {pages} ({rows.length} records)</span><button className="btn btn-ghost" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button></div>
      {sel && <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true"><div className="glass max-h-[90vh] w-full max-w-md overflow-auto p-5"><div className="mb-2 flex justify-between"><h2 className="font-bold">{sel.id}</h2><button aria-label="Close" onClick={() => setSel(null)}><X /></button></div>
        <img className="mx-auto mb-3 rounded bg-white p-1" src={qr} alt="QR code" /><dl className="grid grid-cols-2 gap-1 text-sm">{Object.entries(sel).map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-400">{k}</dt><dd>{String(v ?? '-')}</dd></div>)}</dl></div></div>}
    </div>)
}

function Tracking({ events, cargo }: { events: Ev[]; cargo: Cargo[] }) {
  const ids = Array.from(new Set([...cargo.map(c => c.shipmentId), ...events.map(e => e.shipmentId)]))
  const [id, setId] = useState(ids[0] || '')
  const list = events.filter(e => e.shipmentId === id).sort((a, b) => a.at.localeCompare(b.at))
  const now = new Date().toISOString()
  return (
    <div className="space-y-3"><div className="glass flex flex-wrap items-center gap-3 p-3"><label className="lbl m-0">Shipment ID</label><select className="inp max-w-xs" value={id} onChange={e => setId(e.target.value)}>{ids.map(i => <option key={i}>{i}</option>)}</select>
      <span className="text-sm text-slate-400">{cargo.filter(c => c.shipmentId === id).map(c => c.product).join(', ')}</span></div>
      <div className="glass p-5"><ol className="relative border-l border-violet-400/40 pl-6">{list.map(e => (
        <li key={e.id} className="mb-6"><span className={`absolute -left-[7px] h-3 w-3 rounded-full ${e.at > now ? 'bg-slate-500' : e.kind === 'incident' ? 'bg-red-400' : e.kind === 'handover' ? (e.confirmed ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-cyan-400'}`} />
          <div className="font-semibold">{e.title}{e.kind === 'handover' && <span className={`ml-2 text-xs ${e.confirmed ? 'text-emerald-300' : 'text-amber-300'}`}>{e.confirmed ? 'Confirmed by receiver' : 'Awaiting receiver confirmation'}</span>}</div>
          <div className="text-sm text-slate-300">{e.place}: {fmtLocal(e.at, e.tz)} ({e.tz})</div><div className="text-xs text-slate-500">UTC {e.at.replace('T', ' ').slice(0, 16)}{e.at > now ? ' (scheduled)' : ''}{e.from ? ` | ${e.from} to ${e.to}` : ''}</div></li>))}
        {list.length === 0 && <li className="text-slate-400">No events for this shipment yet.</li>}</ol></div></div>)
}

function Ops(p: { role: Role; cargo: Cargo[]; setCargo: (f: (c: Cargo[]) => Cargo[]) => void; events: Ev[]; setEvents: (f: (e: Ev[]) => Ev[]) => void; tasks: Task[]; setTasks: (f: (t: Task[]) => Task[]) => void; log: (e: Omit<Ev, 'id'>) => void }) {
  const { role, cargo, setCargo, events, setEvents, tasks, setTasks, log } = p
  const [cid, setCid] = useState(''); const [act, setAct] = useState('Receive'); const [actual, setActual] = useState(''); const [cond, setCond] = useState('Good'); const [msg, setMsg] = useState('')
  const [to, setTo] = useState('Warehouse Staff'); const [note, setNote] = useState('')
  const c = cargo.find(x => x.id === cid) || cargo[0]
  const place = c?.location || 'Terminal'; const tz = /air|BLR/i.test(place) ? 'Asia/Kolkata' : 'Asia/Kolkata'
  const toRole = ROLES.find(r => r.name === to)?.id
  const submit = () => {
    if (!c || !(parseFloat(actual) >= 0) || actual === '') { setMsg('Enter the actual counted quantity.'); return }
    const diff = parseFloat(actual) - c.count; const status = cond !== 'Good' ? 'Damaged' : act === 'Receive' ? (diff === 0 ? 'Received' : 'Awaiting verification') : act === 'Load' ? 'Loaded' : 'Unloaded'
    setCargo(l => l.map(x => x.id === c.id ? { ...x, status, updated: new Date().toISOString() } : x))
    log({ shipmentId: c.shipmentId, kind: cond === 'Good' ? 'event' : 'incident', title: `${act} recorded: ${actual} counted vs ${c.count} expected (${cond})`, place, tz, at: new Date().toISOString(), cargoId: c.id })
    setMsg(diff === 0 ? 'Recorded. Quantities match.' : `Recorded with variance of ${diff} units. Cargo flagged for verification.`); setActual('')
  }
  const handover = () => { if (!c) return; log({ shipmentId: c.shipmentId, kind: 'handover', title: `Handover to ${to}`, place, tz, at: new Date().toISOString(), from: role.name, to, toRole, confirmed: false, cargoId: c.id }); setMsg('Handover created. The receiving team must confirm it.') }
  const confirm = (id: string) => setEvents(l => l.map(e => e.id === id ? { ...e, confirmed: true } : e))
  const pend = events.filter(e => e.kind === 'handover')
  const incident = () => { if (!c || !note) return; log({ shipmentId: c.shipmentId, kind: 'incident', title: `Incident: ${note}`, place, tz, at: new Date().toISOString(), cargoId: c.id }); setNote(''); setMsg('Incident logged.') }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass space-y-3 p-4"><h2 className="font-semibold">Receive, load or unload cargo</h2>
        <div><label className="lbl">Cargo<select className="inp mt-1" value={c?.id || ''} onChange={e => setCid(e.target.value)}>{cargo.map(x => <option key={x.id} value={x.id}>{x.id} | {x.shipmentId} | {x.product}</option>)}</select></label></div>
        {c && <p className="text-sm text-slate-300">Expected: {c.qty}. Current status: <Badge s={c.status} /></p>}
        <div className="grid grid-cols-3 gap-2"><Sel label="Action" value={act} onChange={setAct} opts={['Receive', 'Load', 'Unload']} /><div><label className="lbl">Actual count<input className="inp mt-1" type="number" min="0" value={actual} onChange={e => setActual(e.target.value)} /></label></div><Sel label="Condition" value={cond} onChange={setCond} opts={['Good', 'Damaged', 'Missing items']} /></div>
        <button className="btn" onClick={submit}>Confirm {act.toLowerCase()}</button>
        <div className="border-t border-white/10 pt-3"><label className="lbl">Report incident or delay<input className="inp mt-1" value={note} onChange={e => setNote(e.target.value)} placeholder="Describe what happened" /></label><button className="btn btn-ghost mt-2" onClick={incident}>Log incident</button></div>
        {msg && <p role="status" className="text-sm text-cyan-300">{msg}</p>}</div>
      <div className="glass space-y-3 p-4"><h2 className="font-semibold">Handover</h2>
        <Sel label="Hand over to" value={to} onChange={setTo} opts={ROLES.filter(r => ['warehouse', 'driver', 'shipping', 'portstaff', 'airstaff', 'portmgr'].includes(r.id)).map(r => r.name)} /><button className="btn" onClick={handover}>Create handover</button>
        <ul className="space-y-2 text-sm">{pend.map(e => <li key={e.id} className="flex items-center justify-between gap-2 rounded bg-white/5 p-2"><span>{e.shipmentId}: {e.from} to {e.to}<br /><span className="text-xs text-slate-400">{fmtLocal(e.at, e.tz)}</span></span>
          {e.confirmed ? <span className="text-emerald-300">Confirmed</span> : <button className="btn btn-ghost" disabled={role.id !== e.toRole && role.id !== 'admin'} title={role.id !== e.toRole ? `Only ${e.to} can confirm` : ''} onClick={() => confirm(e.id)}>Confirm receipt</button>}</li>)}
          {pend.length === 0 && <li className="text-slate-400">No handovers yet.</li>}</ul></div>
      <div className="glass p-4 lg:col-span-2"><h2 className="mb-2 font-semibold">Tasks</h2><ul className="space-y-2 text-sm">{tasks.map(t => <li key={t.id} className="flex flex-wrap items-center gap-3 rounded bg-white/5 p-2">
        <span className="flex-1">{t.title} <span className="text-slate-400">({t.shipmentId}, due {t.due})</span></span><span className={t.priority === 'High' ? 'text-amber-300' : 'text-slate-400'}>{t.priority}</span><span>{t.status}</span>
        {t.status === 'Pending' && <button className="btn btn-ghost" onClick={() => setTasks(l => l.map(x => x.id === t.id ? { ...x, status: 'In progress' } : x))}>Start</button>}
        {t.status === 'In progress' && <button className="btn" onClick={() => setTasks(l => l.map(x => x.id === t.id ? { ...x, status: 'Done' } : x))}>Complete</button>}</li>)}</ul></div>
    </div>)
}

function Clock() {
  const [now, setNow] = useState(new Date()); useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])
  const base = ['Asia/Kolkata', 'Asia/Singapore', 'Asia/Dubai', 'Europe/Amsterdam', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney']
  const [src, setSrc] = useState('Asia/Kolkata'); const [t, setT] = useState('2026-11-01T09:00'); const [tz2, setTz2] = useState('Europe/Amsterdam')
  const utc = zonedToUtc(t, src)
  return (
    <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{base.map(z => <div key={z} className="glass p-3"><div className="font-mono text-2xl tracking-wider text-cyan-300">{fmtClock(now, z)}</div><div className="text-xs text-slate-400">{z}</div></div>)}</div>
      <div className="glass grid gap-3 p-4 sm:grid-cols-3"><div><label className="lbl">From zone<select className="inp mt-1" value={src} onChange={e => setSrc(e.target.value)}>{allZones().map(z => <option key={z}>{z}</option>)}</select></label></div>
        <div><label className="lbl">Local date and time<input className="inp mt-1" type="datetime-local" value={t} onChange={e => e.target.value && setT(e.target.value)} /></label></div>
        <div><label className="lbl">To zone<select className="inp mt-1" value={tz2} onChange={e => setTz2(e.target.value)}>{allZones().map(z => <option key={z}>{z}</option>)}</select></label></div>
        <div className="sm:col-span-3 text-lg">{fmtLocal(utc, tz2)} <span className="text-sm text-slate-400">in {tz2} | UTC {utc.toISOString().slice(0, 16).replace('T', ' ')}</span></div></div></div>)
}
