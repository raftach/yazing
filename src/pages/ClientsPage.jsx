import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Search, Plus, User, Phone, Mail, MapPin, FileText, Pencil, Trash2, X, Check, History, Tag, CalendarClock } from 'lucide-react';

const EMPTY_CLIENT = { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' };

export default function ClientsPage({ onAddClientDone, autoOpenForm }) {
  const { clients, orders, addClient, updateClient, deleteClient } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [viewClient, setViewClient] = useState(null);
  const [errors, setErrors] = useState({});

  const clientOrders = viewClient 
    ? (orders || []).filter(o => o.clientId === viewClient.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) 
    : [];

  // Find latest payment deadline and latest expected reorder date
  let latestPaymentDate = null;
  let latestReorderDate = null;

  clientOrders.forEach(o => {
    if (!o.archived) {
      if (o.paymentDeadlineDate) {
        if (!latestPaymentDate || new Date(o.paymentDeadlineDate) > new Date(latestPaymentDate)) {
          latestPaymentDate = o.paymentDeadlineDate;
        }
      }
      if (o.expectedReorderDate) {
        if (!latestReorderDate || new Date(o.expectedReorderDate) > new Date(latestReorderDate)) {
          latestReorderDate = o.expectedReorderDate;
        }
      }
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const clientPrices = {};
  (clientOrders || []).forEach(o => {
    if (o.product && o.agreedPrice) {
      if (!clientPrices[o.product]) {
        clientPrices[o.product] = [];
      }
      if (!clientPrices[o.product].includes(o.agreedPrice)) {
         clientPrices[o.product].push(o.agreedPrice);
      }
    }
  });

  useEffect(() => {
    if (autoOpenForm) {
      setForm(EMPTY_CLIENT);
      setEditingId(null);
      setErrors({});
      setShowForm(true);
    }
  }, [autoOpenForm]);

  const filtered = (clients || []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(EMPTY_CLIENT);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (client) => {
    setForm({ ...client });
    setEditingId(client.id);
    setErrors({});
    setShowForm(true);
    setViewClient(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Απαιτείται επωνυμία';

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      e.phone = 'Το τηλέφωνο πρέπει να είναι ακριβώς 10 ψηφία';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editingId) {
      updateClient(editingId, form);
    } else {
      const created = addClient(form);
      if (onAddClientDone) onAddClientDone(created);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    deleteClient(id);
    setViewClient(null);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-row">
          <h1>Πελάτες</h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={15} /> Νέος
          </button>
        </div>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Αναζήτηση πελάτη..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value text-accent">{clients.length}</span>
            <span className="stat-label">Σύνολο Πελατών</span>
          </div>
          <div className="stat-card">
            <span className="stat-value text-success">{filtered.length}</span>
            <span className="stat-label">Αποτελέσματα</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><User size={28} /></div>
            <div className="empty-state-title">Δεν βρέθηκαν πελάτες</div>
            <div className="empty-state-sub">Προσθέστε τον πρώτο σας πελάτη πατώντας "Νέος"</div>
          </div>
        ) : (
          filtered.map(client => (
            <div key={client.id} className="list-item" onClick={() => setViewClient(client)}>
              <div className="list-item-row">
                <span className="list-item-title">{client.name}</span>
              </div>
              {client.contactPerson && (
                <div className="list-item-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={12} /> {client.contactPerson}
                </div>
              )}
              {client.phone && (
                <div className="list-item-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone size={12} /> {client.phone}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Client Detail Sheet */}
      {viewClient && (
        <div className="modal-overlay" onClick={() => setViewClient(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{viewClient.name}</span>
              <button className="btn-icon" onClick={() => setViewClient(null)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              <DetailRow icon={<User size={14}/>} label="Υπεύθυνος" value={viewClient.contactPerson} />
              <DetailRow icon={<Phone size={14}/>} label="Τηλέφωνο" value={viewClient.phone} href={viewClient.phone ? `tel:${viewClient.phone}` : null} />
              <DetailRow icon={<Mail size={14}/>} label="Email" value={viewClient.email} href={viewClient.email ? `mailto:${viewClient.email}` : null} />
              <DetailRow icon={<MapPin size={14}/>} label="Διεύθυνση" value={viewClient.address} />
              {viewClient.notes && <DetailRow icon={<FileText size={14}/>} label="Σημειώσεις" value={viewClient.notes} />}

              {/* Dynamic Dates */}
              {(latestPaymentDate || latestReorderDate) && <div className="divider" style={{ margin: '12px 0' }} />}
              {latestPaymentDate && (
                <DetailRow icon={<CalendarClock size={14} color="var(--danger)" />} label="Τελευταία Προθεσμία Πληρωμής" value={formatDate(latestPaymentDate)} />
              )}
              {latestReorderDate && (
                <DetailRow icon={<CalendarClock size={14} color="var(--warning)" />} label="Επαναληπτική Παραγγελία" value={formatDate(latestReorderDate)} />
              )}

              {/* Order History */}
              <div className="divider" style={{ margin: '16px 0' }} />
              <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <History size={14} /> Ιστορικό Παραγγελιών ({clientOrders.length})
              </div>
              
              {clientOrders.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Δεν υπάρχουν παραγγελίες</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clientOrders.map(o => (
                    <div key={o.id} style={{ 
                      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', 
                      padding: '10px 12px', border: '1px solid var(--border)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{o.product || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Ποσ.: {o.amount} | Μονάδα: {o.agreedPrice}€</span>
                        <span>{(() => {
                          const d = new Date(o.createdAt);
                          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                        })()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price history summary */}
              {Object.keys(clientPrices).length > 0 && (
                <>
                  <div className="divider" style={{ margin: '16px 0' }} />
                  <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Tag size={14} /> Ειδικές Τιμές Πελάτη (Βάσει Ιστορικού)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(clientPrices).map(([product, prices]) => (
                      <div key={product} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{product}</span>
                        <span style={{ fontWeight: 600 }}>{prices.map(p => `${parseFloat(p).toFixed(2)}€`).join(' / ')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-sheet-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(viewClient.id)}>
                <Trash2 size={14} /> Διαγραφή
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => openEdit(viewClient)}>
                <Pencil size={14} /> Επεξεργασία
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Sheet */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{editingId ? 'Επεξεργασία Πελάτη' : 'Νέος Πελάτης'}</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              <div className="form-group">
                <label className="form-label">Επωνυμία *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Εταιρεία Α.Ε." />
                {errors.name && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.name}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Υπεύθυνος</label>
                  <input value={form.contactPerson} onChange={e => setForm(f => ({...f, contactPerson: e.target.value}))} placeholder="Ονοματεπώνυμο" />
                </div>
                <div className="form-group">
                  <label className="form-label">Τηλέφωνο</label>
                  <input 
                    type="tel" 
                    value={form.phone} 
                    onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}))} 
                    placeholder="69XXXXXXXX" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="info@company.gr" />
              </div>
              <div className="form-group">
                <label className="form-label">Διεύθυνση / Έδρα</label>
                <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Οδός, Αριθμός, Πόλη" />
              </div>
              <div className="form-group">
                <label className="form-label">Σημειώσεις</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Πρόσθετες πληροφορίες..." style={{ resize: 'none' }} />
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

function DetailRow({ icon, label, value, href }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
        {href ? (
          <a href={href} style={{ color: 'var(--accent)', fontSize: '15px', fontWeight: 500 }}>{value}</a>
        ) : (
          <div style={{ fontSize: '15px', fontWeight: 500 }}>{value}</div>
        )}
      </div>
    </div>
  );
}
