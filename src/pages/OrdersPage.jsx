import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI, orderStatus, pallets, money } from '../ui';
import { monthLabel, weekdayShort } from '../lib/dates';

const FILTERS = [
  { id: 'active', label: 'Ενεργές', test: o => !o.archived },
  { id: 'unpaid', label: 'Απλήρωτες', test: o => !o.archived && !o.paid },
  { id: 'paid', label: 'Εξοφλημένες', test: o => !o.archived && o.paid },
  { id: 'archived', label: 'Αρχείο', test: o => o.archived },
];
const PAGE = 60;

export default function OrdersPage({ initialFilter }) {
  const { orders, clients } = useApp();
  const { newOrder, openOrder } = useUI();
  const [filter, setFilter] = useState(initialFilter || 'active');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, orders.filter(f.test).length])), [orders]);

  const list = useMemo(() => {
    const f = FILTERS.find(x => x.id === filter);
    const s = search.trim().toLowerCase();
    return orders
      .filter(f.test)
      .filter(o => !s || [clientById.get(o.clientId)?.name, o.product, o.deliveryPlace, o.details]
        .some(v => (v || '').toLowerCase().includes(s)))
      .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [orders, filter, search, clientById]);

  const groups = useMemo(() => {
    const out = [];
    for (const o of list.slice(0, limit)) {
      const ym = (o.orderDate || '').slice(0, 7);
      let g = out[out.length - 1];
      if (!g || g.ym !== ym) { g = { ym, orders: [] }; out.push(g); }
      g.orders.push(o);
    }
    // month totals use the full filtered list, not only the visible page
    const totals = {};
    list.forEach(o => { const ym = (o.orderDate || '').slice(0, 7); totals[ym] = (totals[ym] || 0) + pallets(o); });
    return out.map(g => ({ ...g, total: totals[g.ym] }));
  }, [list, limit]);

  return (
    <div className="page">
      <header className="head">
        <div className="head-row">
          <h1>Παραγγελίες</h1>
          <button className="fab" aria-label="Νέα παραγγελία" onClick={() => newOrder()}><Plus size={22} /></button>
        </div>
        <label className="search">
          <Search size={16} />
          <input id="orders-search" type="search" placeholder="Πελάτης, προϊόν, τόπος…" value={search}
            onChange={e => { setSearch(e.target.value); setLimit(PAGE); }} />
        </label>
        <div className="chips" role="group" aria-label="Φίλτρο">
          {FILTERS.map(f => (
            <button key={f.id} className={`chip${filter === f.id ? ' on' : ''}`} onClick={() => { setFilter(f.id); setLimit(PAGE); }}>
              {f.label}<span className="n">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="body">
        {list.length === 0 ? (
          <div className="empty">
            <b>{search ? 'Δεν βρέθηκαν παραγγελίες' : filter === 'archived' ? 'Το αρχείο είναι άδειο' : 'Δεν υπάρχουν παραγγελίες'}</b>
            {!search && filter === 'active' && <button className="btn btn-go" onClick={() => newOrder()}>Νέα παραγγελία</button>}
          </div>
        ) : (
          <>
            {groups.map(g => (
              <section className="month-block" key={g.ym || 'none'}>
                <div className="month"><span>{g.ym ? monthLabel(g.ym).toUpperCase() : 'ΧΩΡΙΣ ΗΜΕΡΟΜΗΝΙΑ'}</span><span>{g.total} παλ.</span></div>
                {g.orders.map(o => {
                  const st = orderStatus(o);
                  return (
                    <button key={o.id} className="order" onClick={() => openOrder(o.id)}>
                      <span className="day"><b>{(o.orderDate || '').slice(8, 10) || '—'}</b><small>{weekdayShort(o.orderDate)}</small></span>
                      <span className="who">{clientById.get(o.clientId)?.name || 'Άγνωστος πελάτης'}</span>
                      <span className="prod">{o.product}<span className={`pill ${st.cls}`}>{st.text}</span></span>
                      <span className="qty"><b>{o.amount || '—'}</b><small>{o.agreedPrice !== '' ? money(parseFloat(o.agreedPrice)) : '—'}</small></span>
                    </button>
                  );
                })}
              </section>
            ))}
            {list.length > limit && (
              <button className="btn btn-quiet" onClick={() => setLimit(l => l + PAGE)}>Περισσότερες ({list.length - limit})</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
