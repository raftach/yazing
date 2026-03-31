import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Bell, AlertCircle, Clock, Trash2, Edit3, CalendarDays, ArrowRight, AlarmClock } from 'lucide-react';

export default function NotificationsPage({ onGoToOrders }) {
  const { orders, clients, deletedNotifications, markNotificationDeleted, updateOrder } = useApp();
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'reorders'

  const { payments, reorders } = useMemo(() => {
    const pays = [];
    const reords = [];
    const now = new Date();
    // Normalize now to start of day for exact day diffs
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getDiffDays = (dateStr) => {
      const dDate = new Date(dateStr);
      const target = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    };

    const getClientName = (id) => (clients || []).find(c => c.id === id)?.name || 'Άγνωστος πελάτης';

    const activeOrders = (orders || []).filter(o => !o.archived);
    
    activeOrders.forEach(o => {
      // 1. Payment Deadlines
      if (o.paymentDeadlineDate) {
        const id = `pay-${o.id}`;
        if (!deletedNotifications?.includes(id)) {
          const diff = getDiffDays(o.paymentDeadlineDate);
          if (diff <= 7) {
            pays.push({
              id,
              orderId: o.id,
              type: diff < 0 ? 'danger' : (diff === 0 ? 'danger' : 'warning'),
              title: diff < 0 ? `Καθυστέρηση πληρωμής` : (diff === 0 ? 'Λήγει σήμερα' : `Πληρωμή σε ${diff} ημέρες`),
              desc: `${getClientName(o.clientId)} - ${o.product}`,
              days: diff,
              isOverdue: diff < 0,
              dateField: 'paymentDeadlineDate'
            });
          }
        }
      }

      // 2. Expected Reorders
      if (o.expectedReorderDate) {
        const id = `reorder-${o.id}`;
        if (!deletedNotifications?.includes(id)) {
          const diff = getDiffDays(o.expectedReorderDate);
          if (diff <= 1) { // Up to 1 day before
            reords.push({
              id,
              orderId: o.id,
              type: diff < 0 ? 'danger' : (diff === 0 ? 'danger' : 'warning'),
              title: diff < 0 ? `Επαναληπτική παραγγελία` : (diff === 0 ? 'Επαναληπτική παραγγελία σήμερα' : 'Αναμένεται αύριο'),
              desc: `${getClientName(o.clientId)} - ${o.product}`,
              days: diff,
              isOverdue: diff < 0,
              dateField: 'expectedReorderDate'
            });
          }
        }
      }
    });

    pays.sort((a, b) => a.days - b.days);
    reords.sort((a, b) => a.days - b.days);

    return { payments: pays, reorders: reords };

  }, [orders, clients, deletedNotifications]);

  const handleSnooze = (orderId, dateField) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order[dateField]) return;
    
    const d = new Date(order[dateField]);
    d.setDate(d.getDate() + 30);
    const newDateStr = d.toISOString().split('T')[0];
    
    updateOrder(orderId, { [dateField]: newDateStr });
  };

  const typeConfig = {
    danger: { bg: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)' },
    warning: { bg: 'rgba(255, 159, 10, 0.1)', color: 'var(--warning)' },
    info: { bg: 'rgba(10, 132, 255, 0.1)', color: 'var(--accent)' }
  };

  const displayList = activeTab === 'payments' ? payments : reorders;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-row">
          <h1>Ειδοποιήσεις</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <TabBtn active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} count={payments.length}>Πληρωμές</TabBtn>
          <TabBtn active={activeTab === 'reorders'} onClick={() => setActiveTab('reorders')} count={reorders.length}>Επαναληπτικές</TabBtn>
        </div>
      </div>

      <div className="page-content" style={{ paddingBottom: '90px' }}>
        {displayList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={28} /></div>
            <div className="empty-state-title">Καμία ειδοποίηση</div>
            <div className="empty-state-sub">Όλα δείχνουν να είναι εντάξει μέχρι στιγμής!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayList.map(notif => {
              const config = typeConfig[notif.type];
              return (
                <div key={notif.id} className="card" style={{ padding: '14px', borderLeft: `3px solid ${config.color}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ 
                      background: config.bg, color: config.color, 
                      padding: '10px', borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {notif.isOverdue ? <AlertCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px', color: config.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {notif.title}
                        {notif.isOverdue && (
                          <span style={{ fontSize: '11px', background: 'var(--danger)', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                            {Math.abs(notif.days)} ημ. πίσω
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {notif.desc}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    {activeTab === 'reorders' && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleSnooze(notif.orderId, notif.dateField)}
                        title="Αναβολή για 30 ημέρες"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        <AlarmClock size={13} style={{ marginRight: 4 }} /> Αναβολή
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => markNotificationDeleted(notif.id)}
                      title="Διαγραφή Ειδοποίησης"
                      style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    {onGoToOrders && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={onGoToOrders}
                        title="Προβολή παραγγελιών"
                        style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--accent)' }}
                      >
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, count, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '7px 14px',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s',
      flex: 1,
      justifyContent: 'center'
    }}>
      {children}
      <span style={{
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-muted)',
        borderRadius: '99px',
        fontSize: '11px',
        padding: '1px 7px',
        fontWeight: 700,
      }}>{count}</span>
    </button>
  );
}
