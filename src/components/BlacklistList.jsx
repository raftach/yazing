import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI } from '../ui';
import Sheet from './Sheet';

const EMPTY_ENTRY = { name: '', comment: '' };

export default function BlacklistList({ search }) {
  const { blacklist, deleteBlacklistEntry, addBlacklistEntry } = useApp();
  const { confirm, toast } = useUI();
  const [editing, setEditing] = useState(null);

  const s = (search || '').trim().toLowerCase();
  const list = [...blacklist]
    .sort((a, b) => a.name.localeCompare(b.name, 'el'))
    .filter(e => !s || e.name.toLowerCase().includes(s) || (e.comment || '').toLowerCase().includes(s));

  const handleDelete = (entry) => confirm({
    title: 'Αφαίρεση από Blacklist',
    text: `Το «${entry.name}» θα αφαιρεθεί από τη Blacklist.`,
    action: 'Αφαίρεση',
    danger: true,
    onConfirm: () => {
      deleteBlacklistEntry(entry.id);
      toast('Αφαιρέθηκε από τη Blacklist', () => addBlacklistEntry({ name: entry.name, comment: entry.comment }));
    },
  });

  return (
    <>
      {list.length === 0 ? (
        <div className="empty"><b>{s ? 'Δεν βρέθηκαν εγγραφές' : 'Η Blacklist είναι άδεια'}</b></div>
      ) : (
        list.map(entry => (
          <div key={entry.id} className="client-row" style={{ cursor: 'default' }}>
            <span className="who">{entry.name}</span>
            {entry.comment && <span className="meta" style={{ whiteSpace: 'pre-wrap' }}>{entry.comment}</span>}
            <span className="count" style={{ display: 'flex', gap: 2 }}>
              <button className="icon-btn" aria-label="Επεξεργασία" onClick={() => setEditing(entry)}><Pencil size={16} /></button>
              <button className="icon-btn" aria-label="Αφαίρεση" onClick={() => handleDelete(entry)}><Trash2 size={16} /></button>
            </span>
          </div>
        ))
      )}
      {editing && <BlacklistForm entry={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

export function BlacklistForm({ entry, onClose }) {
  const { addBlacklistEntry, updateBlacklistEntry } = useApp();
  const [form, setForm] = useState(() => ({ ...EMPTY_ENTRY, ...(entry || {}) }));
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.name.trim()) { setError('Συμπληρώστε όνομα.'); return; }
    const data = { name: form.name.trim(), comment: form.comment };
    if (entry?.id) updateBlacklistEntry(entry.id, data);
    else addBlacklistEntry(data);
    onClose();
  };

  return (
    <Sheet title={entry?.id ? 'Επεξεργασία' : 'Νέα εγγραφή'} onClose={onClose} short
      left={{ label: 'Άκυρο', onClick: onClose }} right={{ label: 'Αποθήκευση', onClick: handleSave }}>
      <div className="field">
        <label htmlFor="b-name">Ονοματεπώνυμο / Εταιρεία</label>
        <input id="b-name" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Όνομα" />
        {error && <span className="err">{error}</span>}
      </div>
      <div className="field">
        <label htmlFor="b-comment">Σχόλιο / Λόγος</label>
        <textarea id="b-comment" className="input" rows={4} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Ελεύθερο κείμενο..." />
      </div>
    </Sheet>
  );
}
