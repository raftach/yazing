import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Home, ClipboardList, Users, Database } from 'lucide-react';
import { useApp } from './AppContext';
import { UIContext } from './ui';
import TodayPage from './pages/TodayPage';
import OrdersPage from './pages/OrdersPage';
import ClientsPage from './pages/ClientsPage';
import DataPage from './pages/DataPage';
import OrderForm from './components/OrderForm';
import OrderDetail from './components/OrderDetail';
import { ConfirmSheet } from './components/Sheet';
import { paymentAlerts, reorderAlerts } from './lib/alerts';

const NAV_ITEMS = [
  { id: 'today', label: 'Σήμερα', icon: Home },
  { id: 'orders', label: 'Παραγγελίες', icon: ClipboardList },
  { id: 'clients', label: 'Πελάτες', icon: Users },
  { id: 'data', label: 'Δεδομένα', icon: Database },
];

export default function App() {
  const { orders, dismissed } = useApp();
  const [tab, setTab] = useState('today');
  const [ordersFilter, setOrdersFilter] = useState(null);
  const [form, setForm] = useState(null);       // { order } | { preset }
  const [detailId, setDetailId] = useState(null);
  const [toastState, setToastState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const toastTimer = useRef(null);

  const toast = useCallback((text, undo) => {
    clearTimeout(toastTimer.current);
    setToastState({ text, undo, key: Date.now() });
    toastTimer.current = setTimeout(() => setToastState(null), undo ? 5000 : 2500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const goTo = useCallback((id, opts) => {
    setTab(id);
    setOrdersFilter(opts?.filter || null);
    window.scrollTo(0, 0);
  }, []);

  const ui = useMemo(() => ({
    newOrder: (preset) => setForm({ preset }),
    editOrder: (order) => { setDetailId(null); setForm({ order }); },
    openOrder: (id) => setDetailId(id),
    toast,
    confirm: setConfirmState,
    goTo,
  }), [toast, goTo]);

  const badge = useMemo(() => {
    const due = paymentAlerts(orders).filter(a => a.days <= 0).length;
    return due + reorderAlerts(orders, dismissed).length;
  }, [orders, dismissed]);

  return (
    <UIContext.Provider value={ui}>
      {tab === 'today' && <TodayPage />}
      {tab === 'orders' && <OrdersPage key={ordersFilter || 'all'} initialFilter={ordersFilter} />}
      {tab === 'clients' && <ClientsPage />}
      {tab === 'data' && <DataPage />}

      {detailId && <OrderDetail orderId={detailId} onClose={() => setDetailId(null)} />}
      {form && <OrderForm order={form.order} preset={form.preset} onClose={() => setForm(null)} onSaved={toast} />}
      <ConfirmSheet confirm={confirmState} onClose={() => setConfirmState(null)} />

      {toastState && (
        <div className="toast" key={toastState.key} role="status">
          <span>{toastState.text}</span>
          {toastState.undo && (
            <button onClick={() => { toastState.undo(); setToastState(null); }}>Αναίρεση</button>
          )}
        </div>
      )}

      <nav className="tabbar">
        <div className="tabbar-inner">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = tab === item.id;
            return (
              <button key={item.id} className={`tab${isActive ? ' on' : ''}`} onClick={() => goTo(item.id)} aria-current={isActive ? 'page' : undefined}>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
                {item.id === 'today' && badge > 0 && <span className="badge">{badge > 99 ? '99+' : badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    </UIContext.Provider>
  );
}
