import { createContext, useContext } from 'react';
import { daysFromToday, formatShort } from './lib/dates';
import { PAYMENT_WINDOW_DAYS } from './lib/alerts';

// App-level UI actions (open order sheets, show a toast, switch tab) shared by all pages.
export const UIContext = createContext(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIContext');
  return ctx;
}

export function orderStatus(order) {
  if (order.archived) return { cls: 'arch', text: 'αρχείο' };
  if (order.paid) return { cls: 'paid', text: 'εξοφλ.' };
  if (!order.paymentDeadlineDate) return { cls: 'open', text: 'χωρίς λήξη' };
  const days = daysFromToday(order.paymentDeadlineDate);
  if (days < 0) return { cls: 'late', text: `καθυστ. ${-days} ημ.` };
  if (days === 0) return { cls: 'late', text: 'λήγει σήμερα' };
  if (days <= PAYMENT_WINDOW_DAYS) return { cls: 'soon', text: `σε ${days} ημ.` };
  return { cls: 'open', text: `έως ${formatShort(order.paymentDeadlineDate)}` };
}

export function dueText(days) {
  if (days < 0) return `${-days} ημ. καθυστ.`;
  if (days === 0) return 'σήμερα';
  if (days === 1) return 'αύριο';
  return `σε ${days} ημ.`;
}

const euro = new Intl.NumberFormat('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function money(n) {
  return `${euro.format(n || 0)} €`;
}

export function pallets(order) {
  return parseInt(order.amount, 10) || 0;
}
