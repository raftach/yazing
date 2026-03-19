import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, Plus, Package, X, Check, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const EMPTY_PRODUCT = { name: '', code: '', price: '', quantity: '', unit: '', restockingNote: '', description: '' };

export default function ProductsPage({ onAddProductDone, autoOpenForm }) {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [viewProduct, setViewProduct] = useState(null);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (autoOpenForm) {
      setForm(EMPTY_PRODUCT);
      setEditingId(null);
      setErrors({});
      setShowForm(true);
    }
  }, [autoOpenForm]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(EMPTY_PRODUCT); setEditingId(null); setErrors({}); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditingId(p.id); setErrors({}); setShowForm(true); setViewProduct(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Απαιτείται όνομα';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editingId) {
      updateProduct(editingId, form);
    } else {
      const created = addProduct(form);
      if (onAddProductDone) onAddProductDone(created);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => { deleteProduct(id); setViewProduct(null); };

  const getStockBadge = (qty) => {
    const q = parseInt(qty) || 0;
    if (q === 0) return { label: 'Εξαντλημένο', cls: 'badge-danger' };
    if (q < 5) return { label: 'Χαμηλό απόθεμα', cls: 'badge-warning' };
    return { label: 'Διαθέσιμο', cls: 'badge-success' };
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-row">
          <h1>Προϊόντα</h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={15} /> Νέο
          </button>
        </div>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="search" placeholder="Αναζήτηση προϊόντος..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="page-content">
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value text-accent">{products.length}</span>
            <span className="stat-label">Προϊόντα</span>
          </div>
          <div className="stat-card">
            <span className="stat-value text-warning">{products.filter(p => (parseInt(p.quantity) || 0) < 5).length}</span>
            <span className="stat-label">Χαμηλό Απόθεμα</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <div className="empty-state-title">Δεν βρέθηκαν προϊόντα</div>
            <div className="empty-state-sub">Προσθέστε το πρώτο σας προϊόν</div>
          </div>
        ) : (
          filtered.map(product => {
            const stock = getStockBadge(product.quantity);
            const qty = parseInt(product.quantity) || 0;
            return (
              <div key={product.id} className="list-item" onClick={() => setViewProduct(product)}>
                <div className="list-item-row">
                  <span className="list-item-title">{product.name}</span>
                  <span className={`badge ${stock.cls}`}>{stock.label}</span>
                </div>
                <div className="list-item-row">
                  {product.code && <span className="list-item-sub" style={{ fontFamily: 'monospace', fontSize: '12px' }}>#{product.code}</span>}
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Απόθεμα: <strong style={{ color: qty < 5 ? 'var(--warning)' : 'var(--text-primary)' }}>{qty} {product.unit}</strong>
                  </span>
                  {product.price && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{parseFloat(product.price).toFixed(2)}€</span>}
                </div>
                {qty < 5 && qty > 0 && product.restockingNote && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: 'var(--warning)' }}>
                    <AlertTriangle size={11} /> {product.restockingNote}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Product Detail */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{viewProduct.name}</span>
              <button className="btn-icon" onClick={() => setViewProduct(null)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              {viewProduct.code && <InfoRow label="Κωδικός" value={`#${viewProduct.code}`} />}
              <InfoRow label="Τιμή Πώλησης" value={viewProduct.price ? `${parseFloat(viewProduct.price).toFixed(2)} €` : '—'} accent />
              <InfoRow label="Διαθέσιμη Ποσότητα" value={`${viewProduct.quantity || 0} ${viewProduct.unit || 'τεμ.'}`} />
              {viewProduct.restockingNote && <InfoRow label="Σημείωση Αναπλήρωσης" value={viewProduct.restockingNote} />}
              {viewProduct.description && <InfoRow label="Περιγραφή" value={viewProduct.description} />}
            </div>
            <div className="modal-sheet-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(viewProduct.id)}>
                <Trash2 size={14} /> Διαγραφή
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => openEdit(viewProduct)}>
                <Pencil size={14} /> Επεξεργασία
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{editingId ? 'Επεξεργασία Προϊόντος' : 'Νέο Προϊόν'}</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              <div className="form-group">
                <label className="form-label">Όνομα Προϊόντος *</label>
                <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="π.χ. Τσάντα Μεταφοράς" />
                {errors.name && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.name}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Κωδικός</label>
                  <input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="SKU-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Τιμή (€)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ποσότητα</label>
                  <input type="number" min="0" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Μονάδα</label>
                  <input value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} placeholder="τεμ. / kg / lt" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Σημείωση Αναπλήρωσης</label>
                <input value={form.restockingNote} onChange={e => setForm(f=>({...f,restockingNote:e.target.value}))} placeholder="π.χ. Παραγγελία από προμηθευτή Χ" />
              </div>
              <div className="form-group">
                <label className="form-label">Περιγραφή</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Σύντομη περιγραφή..." style={{ resize: 'none' }} />
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

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
