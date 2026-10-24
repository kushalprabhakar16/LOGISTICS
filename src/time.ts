// Time-zone helpers built on the browser's IANA database (Intl). Events are stored as UTC instants.
function offsetMin(tz: string, date: Date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date)
  const g = (t: string) => Number(p.find(x => x.type === t)!.value)
  const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'))
  return (asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000
}
/** Convert a wall-clock "YYYY-MM-DDTHH:mm" in an IANA zone to the exact UTC instant. */
export function zonedToUtc(local: string, tz: string) {
  const [d, t] = local.split('T'); const [y, m, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, da, h, mi)
  const off = offsetMin(tz, new Date(guess)); let res = guess - off * 60000
  const off2 = offsetMin(tz, new Date(res)); if (off2 !== off) res = guess - off2 * 60000
  return new Date(res)
}
export const fmtLocal = (iso: string | Date, tz: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
export const fmtClock = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(d)
export const allZones = (): string[] => {
  const f = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
  return f ? f('timeZone') : ['UTC', 'Asia/Kolkata', 'Europe/London', 'America/New_York']
}
