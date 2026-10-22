import React, { useState } from 'react';
import { useApp } from '../AppContext';
import Sheet from './Sheet';
import { PAYMENT_OPTIONS } from '../lib/dates';
import { blacklistMatch } from '../lib/names';

const EMPTY_CLIENT = { name: '', afm: '', contactPerson: '', phone: '', email: '', address: '', notes: '', defaultPaymentOption: '1month' };

// Add / edit client. Calls onSaved(client) after saving.
export default function ClientForm({ client, onClose, onSaved }) {
  const { addClient, updateClient, blacklist } = useApp();
  const [form, setForm] = useState(() => ({ ...EMPTY_CLIENT, ...(client || {}) }));
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const flagged = blacklistMatch(form.name, blacklist);

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Συμπληρώστε την επωνυμία.';
    if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = 'Το τηλέφωνο θέλει 10 ψηφία.';
    if (Object.keys(e).length) { setErrors(e); return; }
    const data = { ...form, name: form.name.trim() };
    let saved;
    if (client?.id) {
      updateClient(client.id, data);
      saved = { ...client, ...data };
    } else {
      saved = addClient(data);
    }
    onSaved?.(saved);
    onClose();
  };

  return (
    <Sheet
      title={client?.id ? 'Επεξεργασία' : 'Νέος πελάτης'}
      onClose={onClose}
      left={{ label: 'Άκυρο', onClick: onClose }}
      right={{ label: 'Αποθήκευση', onClick: handleSave }}
    >
      <div className="field">
        <label htmlFor="c-name">Επωνυμία</label>
        <input id="c-name" className="input" value={form.name} onChange={set('name')} placeholder="π.χ. Ξυλεία Παππά Ο.Ε." />
        {errors.name && <span className="err">{errors.name}</span>}
        {flagged && <span className="warn">Παρόμοιο όνομα στη Blacklist: «{flagged.name}»{flagged.comment ? ` — ${flagged.comment}` : ''}</span>}
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="c-person">Υπεύθυνος</label>
          <input id="c-person" className="input" value={form.contactPerson} onChange={set('contactPerson')} placeholder="Ονοματεπώνυμο" />
        </div>
        <div className="field">
          <label htmlFor="c-afm">ΑΦΜ</label>
          <input id="c-afm" className="input mono" inputMode="numeric" value={form.afm}
            onChange={set('afm')} placeholder="9 ψηφία" />
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="c-phone">Τηλέφωνο</label>
          <input id="c-phone" className="input mono" type="tel" inputMode="numeric" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="69XXXXXXXX" />
          {errors.phone && <span className="err">{errors.phone}</span>}
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" className="input" type="email" value={form.email} onChange={set('email')} placeholder="info@…" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-address">Διεύθυνση / Έδρα</label>
        <input id="c-address" className="input" value={form.address} onChange={set('address')} placeholder="Οδός, αριθμός, πόλη" />
      </div>
      <div className="field">
        <span className="flabel">Συνήθης πληρωμή</span>
        <div className="seg" role="group" aria-label="Συνήθης πληρωμή">
          {PAYMENT_OPTIONS.map(p => (
            <button key={p.value} type="button" aria-pressed={form.defaultPaymentOption === p.value}
              onClick={() => setForm(f => ({ ...f, defaultPaymentOption: p.value }))}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="c-notes">Σημειώσεις</label>
        <textarea id="c-notes" className="input" rows={3} value={form.notes} onChange={set('notes')} placeholder="Ελεύθερο κείμενο..." />
      </div>
    </Sheet>
  );
}
