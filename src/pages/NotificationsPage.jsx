import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import { Bell, AlertCircle, Clock, CalendarDays, Package, ArrowRight } from 'lucide-react';

export default function NotificationsPage({ onGoToOrders }) {
  const { orders, products, clients } = useApp();

  const notifications = useMemo(() => {
    const list = [];
    const now = new Date();
    // Normalize now to start of day for exact day diffs
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getDiffDays = (dateStr) => {
      const dDate = new Date(dateStr);
      const target = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    };

    const getClientName = (id) => (clients || []).find(c => c.id === id)?.name || 'Άγνωστος πελάτης';

    // 1. Payment Deadlines
    const activeOrders = (orders || []).filter(o => !o.archived && o.status !== 'completed');
    
    activeOrders.forEach(o => {
      if (o.paymentDeadlineDate) {
        const diff = getDiffDays(o.paymentDeadlineDate);
        if (diff < 0 && diff >= -30) {
          // overdue
          list.push({
            id: `pay-${o.id}`,
            type: 'danger',
            icon: AlertCircle,
            title: `Καθυστέρηση πληρωμής (${Math.abs(diff)} ημ.)`,
            desc: `Η παραγγελία του πελάτη ${getClientName(o.clientId)} έληξε. (${o.totalPrice}€)`,
            orderId: o.id,
            days: diff
          });
        } else if (diff >= 0 && diff <= 7) {
          // upcoming
          list.push({
            id: `pay-${o.id}`,
            type: diff <= 3 ? 'warning' : 'info',
            icon: Clock,
            title: diff === 0 ? 'Λήγει σήμερα πληρωμή' : `Πληρωμή σε ${diff} ημέρες`,
            desc: `Η παραγγελία του πελάτη ${getClientName(o.clientId)} πρόκειται να λήξει. (${o.totalPrice}€)`,
            orderId: o.id,
            days: diff
          });
        }
      }

      // 2. Expected Deliveries
      if (o.expectedDeliveryDate) {
        const diff = getDiffDays(o.expectedDeliveryDate);
        if (diff === 0 || diff === 1) {
          list.push({
            id: `deliv-${o.id}`,
            type: 'info',
            icon: CalendarDays,
            title: diff === 0 ? 'Παράδοση σήμερα' : 'Παράδοση αύριο',
            desc: `Προς: ${getClientName(o.clientId)} (${o.deliveryPlace || 'Χωρίς διεύθυνση'})`,
            orderId: o.id,
            days: diff
          });
        }
      }
    });

    // 3. Low Stock Products
    const lowStock = (products || []).filter(p => !p.archived && parseFloat(p.quantity) < 5);
    lowStock.forEach(p => {
      list.push({
        id: `stock-${p.id}`,
        type: 'danger',
        icon: Package,
        title: 'Χαμηλό Απόθεμα',
        desc: `Το προϊόν "${p.name}" έχει μείνει με ${p.quantity} ${p.unit}.`,
        days: -99 // sort bottom
      });
    });

    // Sort by urgency (nearest days first, overdue top, low stock bottom)
    return list.sort((a, b) => a.days - b.days);

  }, [orders, products, clients]);

  const typeConfig = {
    danger: { bg: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)' },
    warning: { bg: 'rgba(255, 159, 10, 0.1)', color: 'var(--warning)' },
    info: { bg: 'rgba(10, 132, 255, 0.1)', color: 'var(--accent)' }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1>Ειδοποιήσεις</h1>
        </div>
      </div>

      <div className="page-content">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={28} /></div>
            <div className="empty-state-title">Δεν υπάρχουν ειδοποιήσεις</div>
            <div className="empty-state-sub">Όλα βαίνουν καλώς! Δεν υπάρχουν εκκρεμότητες.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(notif => {
              const Icon = notif.icon;
              const config = typeConfig[notif.type];
              return (
                <div key={notif.id} className="card" style={{ padding: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ 
                    background: config.bg, color: config.color, 
                    padding: '10px', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px', color: config.color }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {notif.desc}
                    </div>
                  </div>
                  {notif.orderId && onGoToOrders && (
                    <button 
                      className="btn-icon" 
                      onClick={onGoToOrders}
                      title="Προβολή παραγγελιών"
                      style={{ flexShrink: 0 }}
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
