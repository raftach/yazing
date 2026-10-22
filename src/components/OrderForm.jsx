import React, { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useApp } from '../AppContext';
import Sheet from './Sheet';
import Combobox from './Combobox';
import ClientForm from './ClientForm';
import { PAYMENT_OPTIONS, addDays, addMonths, formatDate, paymentDeadline, todayYMD } from '../lib/dates';
import { cleanProduct, productCatalog, productKey } from '../lib/products';
import { typicalGap } from '../lib/alerts';
import { blacklistMatch } from '../lib/names';

function initialForm(order, preset, clients) {
  if (order) {
    return {
      clientId: order.clientId || '',
      product: order.product || '',
      amount: order.amount || '',
      agreedPrice: order.agreedPrice || '',
      paymentOption: order.paymentOption || '1month',
      deliveryPlace: order.deliveryPlace || '',
      details: order.details || '',
      orderDate: order.orderDate || '',
      expectedReorderDate: order.expectedReorderDate || '',
      paymentDeadlineDate: order.paymentDeadlineDate || '',
    };
  }
  const today = todayYMD();
  const client = clients.find(c => c.id === preset?.clientId);
  const paymentOption = client?.defaultPaymentOption || '1month';
  return {
    clientId: client?.id || '',
    product: '',
    amount: '',
    agreedPrice: '',
    paymentOption,
    deliveryPlace: '',
    details: '',
    orderDate: today,
    expectedReorderDate: addMonths(today, 1),
    paymentDeadlineDate: paymentDeadline(today, paymentOption),
  };
}

// New / edit order. `order` = existing order to edit; `preset` = { clientId } for a new one.
export default function OrderForm({ order, preset, onClose, onSaved }) {
  const { orders, clients, blacklist, addOrder, updateOrder } = useApp();
  const editing = !!order;
  const [form, setForm] = useState(() => initialForm(order, preset, clients));
  const [priceFromHistory, setPriceFromHistory] = useState(false);
  const [errors, setErrors] = useState({});
  const [addingClient, setAddingClient] = useState(false);

  const clientOptions = useMemo(() => {
    const count = {};
    orders.forEach(o => { count[o.clientId] = (count[o.clientId] || 0) + 1; });
    return [...clients]
      .sort((a, b) => a.name.localeCompare(b.name, 'el'))
      .map(c => ({
        id: c.id,
        title: c.name,
        subtitle: [c.contactPerson, c.phone, count[c.id] ? `${count[c.id]} παραγγελίες` : ''].filter(Boolean).join(' · '),
        searchContent: `${c.name} ${c.contactPerson || ''} ${c.phone || ''}`,
      }));
  }, [clients, orders]);

  const client = clients.find(c => c.id === form.clientId);
  const flagged = client ? blacklistMatch(client.name, blacklist) : null;

  const lastPrice = (clientId, product) => {
    const key = productKey(product);
    if (!clientId || !key) return null;
    const last = orders
      .filter(o => o.clientId === clientId && productKey(o.product) === key && o.agreedPrice !== '' && o.id !== order?.id)
      .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''))[0];
    return last ? last.agreedPrice : null;
  };

  // Sets the form and, for new orders, fills in the client's last price for this product.
  const commitWithPrice = (next) => {
    const p = editing ? null : lastPrice(next.clientId, next.product);
    if (p !== null) {
      setForm({ ...next, agreedPrice: p });
      setPriceFromHistory(true);
    } else {
      setForm(next);
      if (priceFromHistory) setPriceFromHistory(false);
    }
  };

  const setClient = (id, newClient) => {
    const c = newClient || clients.find(x => x.id === id);
    const paymentOption = editing ? form.paymentOption : (c?.defaultPaymentOption || '1month');
    const next = { ...form, clientId: id, paymentOption };
    if (paymentOption !== 'custom') next.paymentDeadlineDate = paymentDeadline(form.orderDate, paymentOption);
    commitWithPrice(next);
  };

  const setProduct = (value) => commitWithPrice({ ...form, product: value });

  const setOrderDate = (d) => setForm(f => {
    const next = { ...f, orderDate: d };
    if (!d) return next;
    next.expectedReorderDate = addMonths(d, 1);
    if (f.paymentOption !== 'custom') next.paymentDeadlineDate = paymentDeadline(d, f.paymentOption);
    return next;
  });

  const setPaymentOption = (p) => setForm(f => ({
    ...f,
    paymentOption: p,
    paymentDeadlineDate: p === 'custom' ? f.paymentDeadlineDate : paymentDeadline(f.orderDate, p),
  }));

  const stepAmount = (delta) => setForm(f => ({ ...f, amount: String(Math.max(0, (parseInt(f.amount, 10) || 0) + delta)) }));

  // Product suggestions: this client's products first, then everything else.
  const suggestions = useMemo(() => {
    const mine = productCatalog(orders.filter(o => o.clientId === form.clientId));
    const all = productCatalog(orders);
    const seen = new Set();
    const merged = [...mine, ...all].filter(p => !seen.has(p.key) && seen.add(p.key));
    const typed = productKey(form.product);
    if (!typed) return mine.slice(0, 4);
    return merged.filter(p => p.key.includes(typed) && p.name !== form.product).slice(0, 6);
  }, [orders, form.clientId, form.product]);

  const gap = form.clientId ? typicalGap(orders, form.clientId) : null;
  const suggestedReorder = gap && form.orderDate ? addDays(form.orderDate, gap) : '';


  const handleSave = () => {
    const e = {};
    if (!form.clientId) e.clientId = 'Επιλέξτε πελάτη.';
    if (!form.product.trim()) e.product = 'Συμπληρώστε το προϊόν.';
    if (String(form.agreedPrice).trim() === '' || !Number.isFinite(parseFloat(String(form.agreedPrice).replace(',', '.')))) {
      e.agreedPrice = 'Συμπληρώστε τιμή (0 αν είναι δωρεάν).';
    }
    if (!form.orderDate) e.orderDate = 'Συμπληρώστε ημερομηνία.';
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      ...form,
      product: form.product.trim(),
      agreedPrice: String(form.agreedPrice).replace(',', '.').trim(),
    };
    if (editing) updateOrder(order.id, payload);
    else addOrder(payload);
    onSaved?.(editing ? 'Η παραγγελία ενημερώθηκε' : 'Η παραγγελία καταχωρήθηκε');
    onClose();
  };

  return (
    <>
      <Sheet
        title={editing ? 'Επεξεργασία' : 'Νέα παραγγελία'}
        onClose={onClose}
        left={{ label: 'Άκυρο', onClick: onClose }}
        right={{ label: 'Αποθήκευση', onClick: handleSave }}
      >
        <div className="field">
          <label htmlFor="o-client">Πελάτης</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Combobox id="o-client" value={form.clientId} onChange={setClient} options={clientOptions} placeholder="Αναζήτηση πελάτη..." />
            </div>
            <button type="button" className="btn btn-quiet" style={{ width: 48, padding: 0 }} aria-label="Νέος πελάτης" onClick={() => setAddingClient(true)}>
              <UserPlus size={18} />
            </button>
          </div>
          {errors.clientId && <span className="err">{errors.clientId}</span>}
          {flagged && <span className="warn">Παρόμοιο όνομα στη Blacklist: «{flagged.name}»{flagged.comment ? ` — ${flagged.comment}` : ''}</span>}
        </div>

        <div className="field">
          <label htmlFor="o-product">Προϊόν</label>
          <input id="o-product" className="input mono" value={form.product} autoComplete="off"
            onChange={e => setProduct(cleanProduct(e.target.value))} placeholder="π.χ. EUR 1200X800" />
          {suggestions.length > 0 && (
            <div className="sugg">
              {suggestions.map(p => (
                <button key={p.key} type="button" onClick={() => setProduct(p.name)}>{p.name}</button>
              ))}
            </div>
          )}
          {errors.product && <span className="err">{errors.product}</span>}
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="o-amount">Παλέτες</label>
            <div className="stepper">
              <button type="button" aria-label="Μία λιγότερη" onClick={() => stepAmount(-1)}>−</button>
              <input id="o-amount" inputMode="numeric" value={form.amount} placeholder="0"
                onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))} />
              <button type="button" aria-label="Μία περισσότερη" onClick={() => stepAmount(1)}>+</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="o-price">Τιμή μονάδας (€)</label>
            <input id="o-price" className="input mono" inputMode="decimal" value={form.agreedPrice} placeholder="0,00"
              onChange={e => { setPriceFromHistory(false); setForm(f => ({ ...f, agreedPrice: e.target.value.replace(/[^0-9.,]/g, '') })); }} />
            {priceFromHistory && <span className="hint">Τελευταία τιμή του πελάτη</span>}
            {errors.agreedPrice && <span className="err">{errors.agreedPrice}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="o-date">Ημερομηνία παραγγελίας</label>
          <input id="o-date" type="date" className="input mono" value={form.orderDate} onChange={e => setOrderDate(e.target.value)} />
          {errors.orderDate && <span className="err">{errors.orderDate}</span>}
        </div>

        <div className="field">
          <span className="flabel">Πληρωμή</span>
          <div className="seg" role="group" aria-label="Προθεσμία πληρωμής">
            {PAYMENT_OPTIONS.map(p => (
              <button key={p.value} type="button" aria-pressed={form.paymentOption === p.value} onClick={() => setPaymentOption(p.value)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="o-deadline">Λήξη πληρωμής</label>
          <input id="o-deadline" type="date" className="input mono" value={form.paymentDeadlineDate}
            onChange={e => setForm(f => ({ ...f, paymentDeadlineDate: e.target.value, paymentOption: 'custom' }))} />
        </div>

        <div className="field">
          <label htmlFor="o-reorder">Επαναληπτική παραγγελία</label>
          <input id="o-reorder" type="date" className="input mono" value={form.expectedReorderDate}
            onChange={e => setForm(f => ({ ...f, expectedReorderDate: e.target.value }))} />
          {suggestedReorder && suggestedReorder !== form.expectedReorderDate && (
            <div className="sugg">
              <button type="button" onClick={() => setForm(f => ({ ...f, expectedReorderDate: suggestedReorder }))}>
                Βάσει ιστορικού (~{gap} ημ.): {formatDate(suggestedReorder)}
              </button>
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="o-place">Τόπος παράδοσης</label>
          <input id="o-place" className="input" value={form.deliveryPlace} onChange={e => setForm(f => ({ ...f, deliveryPlace: e.target.value }))} placeholder="Πόλη / διεύθυνση" />
        </div>
        <div className="field">
          <label htmlFor="o-notes">Σημειώσεις</label>
          <textarea id="o-notes" className="input" rows={3} value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} placeholder="Ελεύθερο κείμενο..." />
        </div>

        <button className="btn btn-go btn-block" onClick={handleSave}>{editing ? 'Αποθήκευση αλλαγών' : 'Καταχώρηση παραγγελίας'}</button>
      </Sheet>

      {addingClient && (
        <ClientForm onClose={() => setAddingClient(false)} onSaved={(c) => setClient(c.id, c)} />
      )}
    </>
  );
}
