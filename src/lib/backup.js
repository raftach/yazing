import { paymentDeadline, todayYMD } from './dates';

export const BACKUP_VERSION = 2;

// Accepts both formats:
//  v1 (original app): { clients: "<json>", orders: "<json>", blacklist: "<json>" }
//  v2 (this app):     { version: 2, clients: [...], orders: [...], blacklist: [...], dismissed: [...] }
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Το αρχείο δεν είναι έγκυρο JSON.');
  }
  if (!raw || typeof raw !== 'object') throw new Error('Το αρχείο δεν είναι backup του Yazing.');

  const field = (name) => {
    let v = raw[name];
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch { throw new Error(`Το πεδίο «${name}» είναι κατεστραμμένο.`); }
    }
    return v;
  };

  const clients = field('clients');
  const orders = field('orders');
  const blacklist = field('blacklist') || [];
  const dismissed = field('dismissed') || [];

  if (!Array.isArray(clients) || !Array.isArray(orders)) {
    throw new Error('Λείπουν πελάτες ή παραγγελίες από το αρχείο.');
  }
  if (!Array.isArray(blacklist) || !Array.isArray(dismissed)) {
    throw new Error('Το αρχείο έχει λάθος μορφή.');
  }

  return migrate({ clients, orders, blacklist, dismissed }, raw.version || 1);
}

// Brings any stored data up to the current shape. Safe to run more than once.
export function migrate(data, fromVersion = BACKUP_VERSION) {
  const report = { fromVersion, fixedDeadlines: 0 };

  const str = (v) => (v === undefined || v === null ? '' : String(v));

  const clients = data.clients.map(c => ({
    id: str(c.id),
    name: str(c.name),
    afm: str(c.afm),
    contactPerson: str(c.contactPerson),
    phone: str(c.phone),
    email: str(c.email),
    address: str(c.address),
    notes: str(c.notes),
    defaultPaymentOption: c.defaultPaymentOption || '1month',
  }));

  const orders = data.orders.map(o => {
    const order = {
      id: str(o.id),
      clientId: str(o.clientId),
      product: str(o.product),
      amount: str(o.amount),
      agreedPrice: str(o.agreedPrice),
      paymentOption: o.paymentOption || '1month',
      deliveryPlace: str(o.deliveryPlace),
      details: str(o.details),
      orderDate: str(o.orderDate) || str(o.createdAt).slice(0, 10),
      expectedReorderDate: str(o.expectedReorderDate),
      paymentDeadlineDate: str(o.paymentDeadlineDate),
      archived: !!o.archived,
      archivedAt: o.archivedAt || null,
      createdAt: o.createdAt || new Date().toISOString(),
      paid: !!o.paid,
      paidAt: o.paidAt || null,
    };
    // The first app computed deadlines with a DST/month-end bug.
    // For non-custom terms the deadline is derived, so recompute it.
    const correct = paymentDeadline(order.orderDate, order.paymentOption);
    if (correct && correct !== order.paymentDeadlineDate) {
      order.paymentDeadlineDate = correct;
      report.fixedDeadlines++;
    }
    return order;
  });

  const blacklist = data.blacklist.map(b => ({ id: str(b.id), name: str(b.name), comment: str(b.comment) }));
  const dismissed = data.dismissed.filter(x => typeof x === 'string');

  return { clients, orders, blacklist, dismissed, report };
}

// Data left by the original app in this same browser storage, if any,
// in the v1 backup shape so it can go through parseBackup.
export function readLegacyData() {
  try {
    const clients = localStorage.getItem('erp_clients');
    const orders = localStorage.getItem('erp_orders');
    if (!clients || !orders || orders === '[]') return null;
    return JSON.stringify({
      clients,
      orders,
      blacklist: localStorage.getItem('erp_blacklist') || '[]',
      dismissed: localStorage.getItem('erp_deleted_notifs') || '[]',
    });
  } catch {
    return null;
  }
}

export function buildBackup({ clients, orders, blacklist, dismissed }) {
  return JSON.stringify({
    app: 'yazing',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients, orders, blacklist, dismissed,
  });
}

export function backupFileName() {
  return `yazing_backup_${todayYMD()}.json`;
}

// iOS: the share sheet is the only reliable way to save a file from a home-screen app.
export async function shareOrDownload(text, fileName) {
  const file = new File([text], fileName, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
