import { daysFromToday } from './dates';

export const PAYMENT_WINDOW_DAYS = 7;
export const REORDER_WINDOW_DAYS = 1;

// Unpaid, active orders whose payment deadline is overdue or within the window.
export function paymentAlerts(orders) {
  return orders
    .filter(o => !o.archived && !o.paid && o.paymentDeadlineDate)
    .map(o => ({ order: o, days: daysFromToday(o.paymentDeadlineDate) }))
    .filter(a => a.days !== null && a.days <= PAYMENT_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);
}

// One reorder reminder per client, based on that client's latest active order.
// An older order never triggers a reminder once the client has ordered again.
export function reorderAlerts(orders, dismissed) {
  const latest = new Map();
  for (const o of orders) {
    if (o.archived || !o.clientId) continue;
    const cur = latest.get(o.clientId);
    if (!cur || (o.orderDate || '') > (cur.orderDate || '')) latest.set(o.clientId, o);
  }
  return [...latest.values()]
    .filter(o => o.expectedReorderDate && !dismissed.includes(reorderAlertId(o)))
    .map(o => ({ order: o, days: daysFromToday(o.expectedReorderDate) }))
    .filter(a => a.days !== null && a.days <= REORDER_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);
}

// Includes the date so that a snoozed or rescheduled reminder shows up again.
export function reorderAlertId(order) {
  return `reorder-${order.id}-${order.expectedReorderDate}`;
}

// Median days between a client's consecutive orders, or null with fewer than 3 orders.
export function typicalGap(orders, clientId) {
  const dates = orders
    .filter(o => o.clientId === clientId && o.orderDate)
    .map(o => o.orderDate)
    .sort();
  if (dates.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < dates.length; i++) {
    const g = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000);
    if (g > 0) gaps.push(g);
  }
  if (!gaps.length) return null;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}
