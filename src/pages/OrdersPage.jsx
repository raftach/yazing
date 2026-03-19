import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../AppContext';
import {
  Search, Plus, X, Check, Pencil, Archive, RotateCcw, Trash2,
  ChevronRight, ClipboardList, UserPlus, Package, CalendarPlus
} from 'lucide-react';
import Combobox from '../components/Combobox';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Σε Εκκρεμότητα', badge: 'badge-warning' },
  { value: 'processing', label: 'Σε Επεξεργασία', badge: 'badge-info' },
  { value: 'completed', label: 'Ολοκληρωμένη', badge: 'badge-success' },
  { value: 'cancelled', label: 'Ακυρωμένη', badge: 'badge-danger' },
];

const PAYMENT_OPTIONS = [
  { value: 'immediate', label: 'Άμεση Πληρωμή' },
  { value: '1month', label: '1 Μήνας' },
  { value: '2months', label: '2 Μήνες' },
  { value: '3months', label: '3 Μήνες' },
  { value: '6months', label: '6 Μήνες' },
  { value: 'custom', label: 'Συμφωνημένη Ημερομηνία' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

const EMPTY_ORDER = {
  clientId: '',
  product: '',
  amount: '',
  agreedPrice: '',
  paymentOption: 'immediate',
  deliveryPlace: '',
  details: '',
  status: 'pending',
  orderDate: '',
  expectedDeliveryDate: '',
  paymentDeadlineDate: '',
};

export default function OrdersPage({ onGoToAddClient, onGoToAddProduct }) {
  const { orders, clients, products, addOrder, updateOrder, archiveOrder, restoreOrder, permanentDeleteOrder } = useApp();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [viewOrder, setViewOrder] = useState(null);
  const [errors, setErrors] = useState({});

  const activeOrders = useMemo(() => (orders || []).filter(o => !o.archived), [orders]);
  const archivedOrders = useMemo(() => (orders || []).filter(o => o.archived), [orders]);

  const clientOptions = useMemo(() => (clients || []).map(c => ({
    id: c.id,
    title: c.name,
    subtitle: `ΑΦΜ: ${c.afm}`,
    searchContent: `${c.name} ${c.afm} ${c.phone || ''}`
  })), [clients]);

  const productOptions = useMemo(() => {
    const map = new Map();
    if (products && Array.isArray(products)) {
      products.forEach(p => {
        if (!p.archived) {
          map.set(p.name, {
            id: p.name,
            title: p.name,
            subtitle: p.code ? `#${p.code}` : '',
            searchContent: `${p.name} ${p.code || ''}`
          });
        }
      });
    }
    // Add any historical product names that aren't in current inventory
    (orders || []).forEach(o => {
      if (o.product && !map.has(o.product)) {
         map.set(o.product, { id: o.product, title: o.product, subtitle: 'Ιστορικό είδος', searchContent: o.product });
      }
    });
    return Array.from(map.values());
  }, [products, orders]);

  // Auto-fill price based on previous orders of the same product for this client
  useEffect(() => {
    if (editingId) return; // Only auto-fill for new, non-editing orders
    
    if (form.clientId && form.product.trim()) {
      const match = form.product.trim().toLowerCase();
      // Find the most recent order for this client with the exact same product name
      const lastOrder = [...(orders || [])]
        .filter(o => o.clientId === form.clientId && o.product && o.product.trim().toLowerCase() === match)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
      if (lastOrder && lastOrder.agreedPrice !== undefined && lastOrder.agreedPrice !== '') {
        setForm(f => ({ ...f, agreedPrice: lastOrder.agreedPrice }));
      }
    }
  }, [form.clientId, form.product]); // eslint-disable-line react-hooks/exhaustive-deps

  const getList = () => {
    const list = tab === 'active' ? activeOrders : archivedOrders;
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(o => {
      const client = (clients || []).find(c => c.id === o.clientId);
      return (
        (client?.name || '').toLowerCase().includes(s) ||
        (o.product || '').toLowerCase().includes(s) ||
        (o.deliveryPlace || '').toLowerCase().includes(s)
      );
    });
  };

  const filteredOrders = getList();

  const openAdd = () => {
    setForm({ ...EMPTY_ORDER, orderDate: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setErrors({});
    setShowForm(true);
    setViewOrder(null);
  };

  const openEdit = (order) => {
    setForm({
      clientId: order.clientId || '',
      product: order.product || '',
      amount: order.amount || '',
      agreedPrice: order.agreedPrice || '',
      paymentOption: order.paymentOption || 'immediate',
      deliveryPlace: order.deliveryPlace || '',
      details: order.details || '',
      status: order.status || 'pending',
      orderDate: order.orderDate || '',
      expectedDeliveryDate: order.expectedDeliveryDate || '',
      paymentDeadlineDate: order.paymentDeadlineDate || '',
    });
    setEditingId(order.id);
    setErrors({});
    setShowForm(true);
    setViewOrder(null);
  };

  const validate = () => {
    const e = {};
    if (!form.clientId) e.clientId = 'Επιλέξτε πελάτη';
    if (!form.product.trim()) e.product = 'Απαιτείται προϊόν';
    if (!form.expectedDeliveryDate) e.expectedDeliveryDate = 'Απαιτείται ημερομηνία παράδοσης';
    if (form.agreedPrice === '' || form.agreedPrice === null || form.agreedPrice === undefined) {
      e.agreedPrice = 'Απαιτείται τιμή (βάλτε 0 αν είναι δωρεάν)';
    }
    return e;
  };

  const totalPrice = () => {
    const amt = parseFloat(form.amount) || 0;
    const price = parseFloat(form.agreedPrice) || 0;
    return (amt * price).toFixed(2);
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload = { ...form, totalPrice: totalPrice() };
    if (editingId) updateOrder(editingId, payload);
    else addOrder(payload);
    setShowForm(false);
  };

  const getClientName = (id) => (clients || []).find(c => c.id === id)?.name || '—';

  const formatDate = (iso) => {
    if (!iso) return '';
    let ymd = iso;
    if (ymd.includes('T')) ymd = ymd.split('T')[0];
    const [y, m, d] = ymd.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-row">
          <h1>Παραγγελίες</h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={15} /> Νέα
          </button>
        </div>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="search" placeholder="Αναζήτηση παραγγελίας..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <TabBtn active={tab === 'active'} onClick={() => setTab('active')} count={activeOrders.length}>Ενεργές</TabBtn>
          <TabBtn active={tab === 'archived'} onClick={() => setTab('archived')} count={archivedOrders.length}>Αρχείο</TabBtn>
        </div>
      </div>

      <div className="page-content">
        {/* Stats row only for active tab */}
        {tab === 'active' && (
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-value text-accent">{activeOrders.length}</span>
              <span className="stat-label">Ενεργές</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-success">
                {activeOrders.filter(o => o.status === 'completed').length}
              </span>
              <span className="stat-label">Ολοκληρωμένες</span>
            </div>
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={28} /></div>
            <div className="empty-state-title">{tab === 'archived' ? 'Δεν υπάρχουν αρχειοθετημένες' : 'Δεν υπάρχουν παραγγελίες'}</div>
            <div className="empty-state-sub">
              {tab === 'active' ? 'Δημιουργήστε την πρώτη παραγγελία πατώντας "Νέα"' : 'Οι αρχειοθετημένες παραγγελίες θα εμφανιστούν εδώ'}
            </div>
          </div>
        ) : (
          filteredOrders.map(order => {
            const statusInfo = STATUS_MAP[order.status] || STATUS_OPTIONS[0];
            return (
              <div key={order.id} className="list-item" onClick={() => setViewOrder(order)}>
                <div className="list-item-row">
                  <span className="list-item-title">{getClientName(order.clientId)}</span>
                  <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                </div>
                <div className="list-item-row">
                  <span className="list-item-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={12} /> {order.product || '—'}
                  </span>
                  {order.totalPrice && <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{parseFloat(order.totalPrice).toFixed(2)}€</span>}
                </div>
                {order.deliveryPlace && <span className="list-item-sub" style={{ fontSize: '12px' }}>📍 {order.deliveryPlace}</span>}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Sheet */}
      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">Λεπτομέρειες Παραγγελίας</span>
              <button className="btn-icon" onClick={() => setViewOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              <OrderDetailSection order={viewOrder} clients={clients} />
            </div>
            <div className="modal-sheet-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
              {!viewOrder.archived ? (
                <>
                  <button className="btn btn-danger btn-sm" onClick={() => { archiveOrder(viewOrder.id); setViewOrder(null); }}>
                    <Archive size={13} /> Αρχείο
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(viewOrder)}>
                    <Pencil size={13} /> Επεξεργασία
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => { restoreOrder(viewOrder.id); setViewOrder(null); }}>
                    <RotateCcw size={13} /> Επαναφορά
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { permanentDeleteOrder(viewOrder.id); setViewOrder(null); }}>
                    <Trash2 size={13} /> Οριστική Διαγραφή
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Order Form Sheet */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{editingId ? 'Επεξεργασία Παραγγελίας' : 'Νέα Παραγγελία'}</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              {/* Client picker */}
              <div className="form-group">
                <label className="form-label">Πελάτης *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <Combobox
                      value={form.clientId}
                      onChange={val => setForm(f => ({ ...f, clientId: val }))}
                      options={clientOptions}
                      placeholder="Αναζήτηση πελάτη..."
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    title="Νέος Πελάτης"
                    style={{ flexShrink: 0, width: 44, height: 44 }}
                    onClick={() => { setShowForm(false); if (onGoToAddClient) onGoToAddClient(); }}
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
                {errors.clientId && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.clientId}</span>}
              </div>

              {/* Show client info */}
              {form.clientId && (() => {
                const c = clients.find(cl => cl.id === form.clientId);
                return c ? (
                  <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 13px', marginTop: '-4px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ΑΦΜ: {c.afm} · {c.contactPerson} · {c.phone}</div>
                  </div>
                ) : null;
              })()}

              <div className="form-group">
                <label className="form-label">Προϊόν / Περιγραφή *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <Combobox
                      value={form.product}
                      onChange={val => {
                        setForm(f => ({ ...f, product: val }));
                      }}
                      options={productOptions}
                      placeholder="Αναζήτηση ή επιλογή προϊόντος..."
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    title="Νέο Προϊόν"
                    style={{ flexShrink: 0, width: 44, height: 44, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    onClick={() => { setShowForm(false); if (onGoToAddProduct) onGoToAddProduct(); }}
                  >
                    <Plus size={16} color="var(--accent)" />
                  </button>
                </div>
                {errors.product && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.product}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ημερ/νία Παραγγελίας</label>
                  <input type="date" value={form.orderDate} onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Αναμενόμενη Παράδοση *</label>
                  <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))} />
                  {errors.expectedDeliveryDate && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.expectedDeliveryDate}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ποσότητα</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Τιμή Μονάδας (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.agreedPrice} onChange={e => setForm(f => ({ ...f, agreedPrice: e.target.value }))} placeholder="0.00" />
                  {errors.agreedPrice && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.agreedPrice}</span>}
                </div>
              </div>

              {/* Total */}
              {(form.amount || form.agreedPrice) && (
                <div style={{
                  background: 'var(--accent-soft)', border: '1px solid rgba(79,142,247,0.2)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Σύνολο Παραγγελίας</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>{totalPrice()}€</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Τρόπος Πληρωμής</label>
                <select value={form.paymentOption} onChange={e => setForm(f => ({ ...f, paymentOption: e.target.value }))}>
                  {PAYMENT_OPTIONS.map(p => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Προθεσμία Πληρωμής</label>
                <input type="date" value={form.paymentDeadlineDate} onChange={e => setForm(f => ({ ...f, paymentDeadlineDate: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Τόπος Παράδοσης</label>
                <input value={form.deliveryPlace} onChange={e => setForm(f => ({ ...f, deliveryPlace: e.target.value }))} placeholder="Πόλη / Διεύθυνση" />
              </div>

              <div className="form-group">
                <label className="form-label">Κατάσταση</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Λεπτομέρειες / Σημειώσεις</label>
                <textarea rows={3} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} placeholder="Ελεύθερο κείμενο..." style={{ resize: 'none' }} />
              </div>
            </div>
            <div className="modal-sheet-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Ακύρωση</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                <Check size={14} /> {editingId ? 'Αποθήκευση' : 'Δημιουργία'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function generateICS(order, client) {
  let events = [];
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const createEvent = (summary, dateStr, description) => {
    if (!dateStr) return '';
    const start = dateStr.replace(/-/g, '');
    const end = start; // all-day event
    return `BEGIN:VEVENT
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
DTSTAMP:${dtstamp}
UID:${order.id}-${start}-${Math.random().toString(36).substr(2,9)}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT`;
  };

  const clientName = client?.name || 'Άγνωστος πελάτης';
  const desc = `Προϊόν: ${order.product}\\nΠοσότητα: ${order.amount}\\nΣύνολο: ${order.totalPrice}€\\nΠελάτης: ${clientName}`;

  if (order.orderDate) events.push(createEvent(`Παραγγελία: ${clientName}`, order.orderDate, desc));
  if (order.expectedDeliveryDate) events.push(createEvent(`Παράδοση παραγγελίας: ${clientName}`, order.expectedDeliveryDate, desc + `\\nΤόπος: ${order.deliveryPlace || ''}`));
  if (order.paymentDeadlineDate) events.push(createEvent(`Προθεσμία πληρωμής: ${clientName}`, order.paymentDeadlineDate, desc));

  if (events.length === 0) {
    alert('Δεν έχουν οριστεί ημερομηνίες για αυτή την παραγγελία.');
    return;
  }

  const icsStr = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Yazing//Calendar Sync//EL
CALSCALE:GREGORIAN
${events.join('\n')}
END:VCALENDAR`;

  const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `order-${order.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function OrderDetailSection({ order, clients }) {
  const client = (clients || []).find(c => c.id === order.clientId);
  const statusInfo = STATUS_MAP[order.status] || STATUS_OPTIONS[0];
  const paymentLabel = PAYMENT_OPTIONS.find(p => p.value === order.paymentOption)?.label || order.paymentOption;

  const formatDateString = (ymd) => {
    if (!ymd) return '';
    let iso = ymd;
    if (iso.includes('T')) iso = iso.split('T')[0];
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return ymd;
    return `${d}/${m}/${y}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`badge ${statusInfo.badge}`} style={{ fontSize: '13px', padding: '5px 12px' }}>{statusInfo.label}</span>
        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
          {order.totalPrice ? `${parseFloat(order.totalPrice).toFixed(2)}€` : '—'}
        </span>
      </div>

      <div className="divider" />

      <section>
        <div className="section-label" style={{ marginBottom: 10 }}>Πελάτης</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>{client?.name || '—'}</div>
        {client?.afm && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>ΑΦΜ: {client.afm}</div>}
        {client?.contactPerson && <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Υπεύθυνος: {client.contactPerson}</div>}
        {client?.phone && <div style={{ fontSize: '13px' }}><a href={`tel:${client.phone}`} style={{ color: 'var(--accent)' }}>📞 {client.phone}</a></div>}
      </section>

      <div className="divider" />

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Παραγγελία</div>
          <button className="btn btn-secondary btn-sm" onClick={() => generateICS(order, client)} title="Προσθήκη στο ημερολόγιο" style={{ padding: '4px 8px', fontSize: '11px' }}>
            <CalendarPlus size={13} style={{ marginRight: 4 }} /> Ημερολόγιο
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <InfoRow2 label="Ημερομηνία" value={formatDateString(order.orderDate)} />
          <InfoRow2 label="Αναμ. Παράδοση" value={formatDateString(order.expectedDeliveryDate)} />
          <InfoRow2 label="Λήξη Πληρωμής" value={formatDateString(order.paymentDeadlineDate)} />
          <InfoRow2 label="Προϊόν" value={order.product} />
          <InfoRow2 label="Ποσότητα" value={order.amount} />
          <InfoRow2 label="Τιμή Μονάδας" value={order.agreedPrice ? `${order.agreedPrice}€` : null} />
          <InfoRow2 label="Τόπος Παράδοσης" value={order.deliveryPlace} />
          <InfoRow2 label="Πληρωμή" value={paymentLabel} />
        </div>
      </section>

      {order.details && (
        <>
          <div className="divider" />
          <section>
            <div className="section-label" style={{ marginBottom: 6 }}>Σημειώσεις</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{order.details}</div>
          </section>
        </>
      )}
    </div>
  );
}

function InfoRow2({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
