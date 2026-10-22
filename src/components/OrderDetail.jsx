import React from 'react';
import { Archive, CalendarPlus, Pencil, RotateCcw, Trash2, Check } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI, orderStatus, money } from '../ui';
import Sheet from './Sheet';
import { PAYMENT_OPTIONS, addDays, formatDate } from '../lib/dates';

function icsText(order, client) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const esc = (s) => String(s || '').replace(/[\\,;]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const name = client?.name || 'Άγνωστος πελάτης';
  const desc = esc(`Προϊόν: ${order.product}\nΠαλέτες: ${order.amount || '-'}\nΠελάτης: ${name}`);
  const event = (kind, summary, ymd) => ymd ? [
    'BEGIN:VEVENT',
    `UID:yazing-${order.id}-${kind}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${addDays(ymd, 1).replace(/-/g, '')}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
  ].join('\r\n') : null;
  const events = [
    event('reorder', `Επαναληπτική: ${name}`, order.expectedReorderDate),
    !order.paid && event('payment', `Λήξη πληρωμής: ${name}`, order.paymentDeadlineDate),
  ].filter(Boolean);
  if (!events.length) return null;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Yazing//EL', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');
}

function openCalendar(order, client) {
  const text = icsText(order, client);
  if (!text) return false;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `yazing-${order.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export default function OrderDetail({ orderId, onClose }) {
  const { orders, clients, setOrderPaid, archiveOrder, restoreOrder, permanentDeleteOrder } = useApp();
  const { editOrder, toast, confirm } = useUI();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  const client = clients.find(c => c.id === order.clientId);
  const status = orderStatus(order);
  const terms = PAYMENT_OPTIONS.find(p => p.value === order.paymentOption)?.long || order.paymentOption;

  const togglePaid = () => {
    setOrderPaid(order.id, !order.paid);
    toast(order.paid ? 'Σημειώθηκε ως απλήρωτη' : 'Σημειώθηκε ως εξοφλημένη');
  };

  return (
    <Sheet title="Παραγγελία" onClose={onClose} right={!order.archived ? { label: 'Επεξεργασία', onClick: () => editOrder(order) } : null}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="pill-row"><span className={`pill ${status.cls}`}>{status.text}</span></span>
        <h3>{client?.name || 'Άγνωστος πελάτης'}</h3>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{order.product}</span>
      </div>

      {!order.archived && (
        <div className="paybox">
          <div className="amt">
            {order.paid ? formatDate((order.paidAt || '').slice(0, 10)) || '—' : formatDate(order.paymentDeadlineDate) || '—'}
            <small>{order.paid ? 'Εξοφλήθηκε' : 'Λήξη πληρωμής'}</small>
          </div>
          <button className={`btn ${order.paid ? 'btn-quiet' : 'btn-go'}`} onClick={togglePaid}>
            {order.paid ? 'Αναίρεση' : <><Check size={16} /> Εξοφλήθηκε</>}
          </button>
        </div>
      )}

      <dl className="kv">
        <div><dt>Ημερομηνία</dt><dd className="mono">{formatDate(order.orderDate)}</dd></div>
        <div><dt>Παλέτες</dt><dd className="mono">{order.amount || '—'}</dd></div>
        <div><dt>Τιμή μονάδας</dt><dd className="mono">{order.agreedPrice !== '' ? money(parseFloat(order.agreedPrice)) : '—'}</dd></div>
        <div><dt>Πληρωμή</dt><dd>{terms}</dd></div>
        <div><dt>Λήξη πληρωμής</dt><dd className="mono">{formatDate(order.paymentDeadlineDate) || '—'}</dd></div>
        <div><dt>Επαναληπτική</dt><dd className="mono">{formatDate(order.expectedReorderDate) || '—'}</dd></div>
        {order.deliveryPlace && <div><dt>Παράδοση</dt><dd>{order.deliveryPlace}</dd></div>}
        {client?.phone && <div><dt>Τηλέφωνο</dt><dd className="mono"><a href={`tel:${client.phone}`}>{client.phone}</a></dd></div>}
      </dl>

      {order.details && <div className="notes">{order.details}</div>}

      <div className="sheet-foot">
        {!order.archived ? (
          <>
            <button className="btn btn-quiet" onClick={() => { if (!openCalendar(order, client)) toast('Δεν υπάρχουν ημερομηνίες για το ημερολόγιο'); }}>
              <CalendarPlus size={16} /> Ημερολόγιο
            </button>
            <button className="btn btn-quiet" onClick={() => editOrder(order)}><Pencil size={16} /> Επεξεργασία</button>
            <button className="btn btn-quiet" onClick={() => { archiveOrder(order.id); onClose(); toast('Μεταφέρθηκε στο αρχείο', () => restoreOrder(order.id)); }}>
              <Archive size={16} /> Αρχείο
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-quiet" onClick={() => { restoreOrder(order.id); toast('Η παραγγελία επανήλθε'); }}>
              <RotateCcw size={16} /> Επαναφορά
            </button>
            <button className="btn btn-danger" onClick={() => confirm({
              title: 'Οριστική διαγραφή',
              text: `Η παραγγελία «${order.product}» του πελάτη ${client?.name || '—'} θα διαγραφεί οριστικά. Δεν γίνεται αναίρεση.`,
              action: 'Διαγραφή',
              danger: true,
              onConfirm: () => { onClose(); permanentDeleteOrder(order.id); toast('Η παραγγελία διαγράφηκε'); },
            })}>
              <Trash2 size={16} /> Διαγραφή
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
