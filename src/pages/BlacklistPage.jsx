import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, Plus, ShieldBan, X, Check, Pencil, Trash2, UserX } from 'lucide-react';

const EMPTY_ENTRY = { name: '', comment: '' };

export default function BlacklistPage() {
  const { blacklist, addBlacklistEntry, updateBlacklistEntry, deleteBlacklistEntry } = useApp();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [errors, setErrors] = useState({});

  // Alphabetical sort by name
  const sortedBlacklist = [...(blacklist || [])].sort((a, b) => a.name.localeCompare(b.name, 'el'));

  const filtered = sortedBlacklist.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.comment.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(EMPTY_ENTRY);
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (entry) => {
    setForm({ ...entry });
    setEditingId(entry.id);
    setErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Απαιτείται όνομα';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editingId) {
      updateBlacklistEntry(editingId, form);
    } else {
      addBlacklistEntry(form);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εγγραφή από τη λίστα Blacklist;')) {
      deleteBlacklistEntry(id);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-title-row">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <ShieldBan size={24} /> Blacklist
          </h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={15} /> Προσθήκη
          </button>
        </div>
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Αναζήτηση στη blacklist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="page-content">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <UserX size={28} />
            </div>
            <div className="empty-state-title">Άδεια Λίστα</div>
            <div className="empty-state-sub">Δεν υπάρχουν άτομα στη Blacklist.</div>
          </div>
        ) : (
          filtered.map(entry => (
            <div key={entry.id} className="list-item" style={{ borderLeft: '3px solid var(--border)' }}>
              <div className="list-item-row" style={{ marginBottom: 4 }}>
                <span className="list-item-title">{entry.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn-icon" onClick={() => openEdit(entry)} style={{ width: 28, height: 28 }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(entry.id)} style={{ width: 28, height: 28, color: 'var(--text-primary)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {entry.comment && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, paddingRight: '10px' }}>
                  {entry.comment}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Sheet */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <div className="modal-sheet-header">
              <span className="modal-sheet-title">{editingId ? 'Επεξεργασία Blacklist' : 'Νέα Εγγραφή Blacklist'}</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div className="modal-sheet-body">
              <div className="form-group">
                <label className="form-label">Ονοματεπώνυμο / Εταιρεία *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                  placeholder="Εισάγετε όνομα" 
                />
                {errors.name && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Σχόλιο / Λόγος</label>
                <textarea 
                  rows={4} 
                  value={form.comment} 
                  onChange={e => setForm(f => ({...f, comment: e.target.value}))} 
                  placeholder="Ελεύθερο κείμενο..." 
                  style={{ resize: 'none' }} 
                />
              </div>
            </div>
            <div className="modal-sheet-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Ακύρωση</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>
                <Check size={14} /> {editingId ? 'Αποθήκευση' : 'Προσθήκη'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
