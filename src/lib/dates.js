// All dates in the app are plain calendar days stored as 'YYYY-MM-DD'.
// These helpers never go through UTC, so they are immune to DST shifts
// and to the "after midnight it's still yesterday in UTC" problem.

const pad = (n) => String(n).padStart(2, '0');

export function toYMD(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayYMD() {
  return toYMD(new Date());
}

function parse(ymd) {
  if (!ymd) return null;
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

// Adds calendar months, clamping to the last day of the target month
// (31 Jan + 1 month = 28/29 Feb, not 3 Mar).
export function addMonths(ymd, months) {
  const p = parse(ymd);
  if (!p) return '';
  const idx = (p.m - 1) + months;
  const y = p.y + Math.floor(idx / 12);
  const m = ((idx % 12) + 12) % 12 + 1;
  const last = new Date(y, m, 0).getDate();
  return `${y}-${pad(m)}-${pad(Math.min(p.d, last))}`;
}

export function addDays(ymd, days) {
  const p = parse(ymd);
  if (!p) return '';
  return toYMD(new Date(p.y, p.m - 1, p.d + days));
}

// Whole days from today to ymd (negative = in the past).
export function daysFromToday(ymd) {
  const p = parse(ymd);
  if (!p) return null;
  const t = new Date();
  const a = Date.UTC(p.y, p.m - 1, p.d);
  const b = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((a - b) / 86400000);
}

export function formatDate(ymd) {
  const p = parse(ymd);
  if (!p) return '';
  return `${pad(p.d)}.${pad(p.m)}.${p.y}`;
}

export function formatShort(ymd) {
  const p = parse(ymd);
  if (!p) return '';
  return `${pad(p.d)}.${pad(p.m)}`;
}

const WEEKDAYS = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];
export function weekdayShort(ymd) {
  const p = parse(ymd);
  if (!p) return '';
  return WEEKDAYS[new Date(p.y, p.m - 1, p.d).getDay()];
}

export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleString('el-GR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function longToday() {
  const s = new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const PAYMENT_MONTHS = { '1month': 1, '2months': 2, '3months': 3 };

export const PAYMENT_OPTIONS = [
  { value: '1month', label: '30 ημ.', long: '1 Μήνας' },
  { value: '2months', label: '60 ημ.', long: '2 Μήνες' },
  { value: '3months', label: '90 ημ.', long: '3 Μήνες' },
  { value: 'custom', label: 'Άλλο', long: 'Προσαρμοσμένο' },
];

export function paymentDeadline(orderDate, paymentOption) {
  const months = PAYMENT_MONTHS[paymentOption];
  return months ? addMonths(orderDate, months) : '';
}
