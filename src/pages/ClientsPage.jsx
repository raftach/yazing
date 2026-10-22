import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI, orderStatus, money, pallets } from '../ui';
import Sheet from '../components/Sheet';
import ClientForm from '../components/ClientForm';
import BlacklistList, { BlacklistForm } from '../components/BlacklistList';
import { formatDate, formatShort } from '../lib/dates';
import { productCatalog, productKey } from '../lib/products';
import { typicalGap } from '../lib/alerts';
import { blacklistMatch } from '../lib/names';

export default function ClientsPage() {
  const { clients, orders, blacklist } = useApp();
  const [view, setView] = useState('clients');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null); // client object or {} for new
  const [addingBlacklist, setAddingBlacklist] = useState(false);

  const stats = useMemo(() => {
    const m = new Map();
    for (const o of orders) {
      const s = m.get(o.clientId) || { count: 0, last: '' };
      s.count++;
      if ((o.orderDate || '') > s.last) s.last = o.orderDate;
      m.set(o.clientId, s);
    }
    return m;
  }, [orders]);

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return clients
      .filter(c => !s || [c.name, c.contactPerson, c.phone, c.afm].some(v => (v || '').toLowerCase().includes(s)))
      .sort((a, b) => a.name.localeCompare(b.name, 'el'));
  }, [clients, search]);

  return (
    <div className="page">
      <header className="head">
        <div className="head-row">
          <h1>{view === 'clients' ? 'Πελάτες' : 'Blacklist'}</h1>
          <button className="fab" aria-label={view === 'clients' ? 'Νέος πελάτης' : 'Νέα εγγραφή Blacklist'}
            onClick={() => view === 'clients' ? setEditing({}) : setAddingBlacklist(true)}><Plus size={22} /></button>
        </div>
        <div className="seg" role="group" aria-label="Προβολή">
          <button aria-pressed={view === 'clients'} onClick={() => setView('clients')}>Πελάτες · {clients.length}</button>
          <button aria-pressed={view === 'blacklist'} onClick={() => setView('blacklist')}>Blacklist · {blacklist.length}</button>
        </div>
        <label className="search">
          <Search size={16} />
          <input id="clients-search" type="search" placeholder={view === 'clients' ? 'Όνομα, τηλέφωνο, ΑΦΜ…' : 'Αναζήτηση στη Blacklist…'}
            value={search} onChange={e => setSearch(e.target.value)} />
        </label>
      </header>

      <div className="body" style={{ gap: 0 }}>
        {view === 'blacklist' ? (
          <BlacklistList search={search} />
        ) : list.length === 0 ? (
          <div className="empty">
            <b>{search ? 'Δεν βρέθηκαν πελάτες' : 'Δεν υπάρχουν πελάτες'}</b>
            {!search && <button className="btn btn-go" onClick={() => setEditing({})}>Νέος πελάτης</button>}
          </div>
        ) : (
          list.map(c => {
            const s = stats.get(c.id);
            const flagged = blacklistMatch(c.name, blacklist);
            return (
              <button key={c.id} className="client-row" onClick={() => setOpenId(c.id)}>
                <span className="who">{c.name}{flagged && <span className="pill late" style={{ marginLeft: 8 }}>blacklist</span>}</span>
                <span className="meta">{[c.contactPerson, c.phone].filter(Boolean).join(' · ') || (s ? `τελευταία ${formatDate(s.last)}` : 'χωρίς παραγγελίες')}</span>
                <span className="count"><b>{s?.count || 0}</b>{s ? formatShort(s.last) : ''}</span>
              </button>
            );
          })
        )}
      </div>

      {openId && <ClientDetail clientId={openId} onClose={() => setOpenId(null)} onEdit={(c) => setEditing(c)} />}
      {editing && <ClientForm client={editing.id ? editing : null} onClose={() => setEditing(null)} />}
      {addingBlacklist && <BlacklistForm onClose={() => setAddingBlacklist(false)} />}
    </div>
  );
}

function ClientDetail({ clientId, onClose, onEdit }) {
  const { clients, orders, blacklist, deleteClient } = useApp();
  const { newOrder, openOrder, confirm, toast } = useUI();
  const client = clients.find(c => c.id === clientId);

  const history = useMemo(
    () => orders.filter(o => o.clientId === clientId).sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || '')),
    [orders, clientId]
  );
  if (!client) return null;

  const unpaid = history.filter(o => !o.archived && !o.paid);
  const totalPallets = history.filter(o => !o.archived).reduce((s, o) => s + pallets(o), 0);
  const gap = typicalGap(orders, clientId);
  const flagged = blacklistMatch(client.name, blacklist);

  // Last price per product (variants merged), newest first.
  const prices = productCatalog(history).map(p => {
    const last = history.find(o => productKey(o.product) === p.key && o.agreedPrice !== '');
    return { name: p.name, price: last?.agreedPrice, date: last?.orderDate };
  }).filter(p => p.price !== undefined);

  const handleDelete = () => confirm({
    title: 'Διαγραφή πελάτη',
    text: history.length
      ? `Ο πελάτης «${client.name}» έχει ${history.length} παραγγελίες. Οι παραγγελίες θα παραμείνουν αλλά θα εμφανίζονται ως «Άγνωστος πελάτης».`
      : `Ο πελάτης «${client.name}» θα διαγραφεί.`,
    action: 'Διαγραφή',
    danger: true,
    onConfirm: () => { onClose(); deleteClient(client.id); toast('Ο πελάτης διαγράφηκε'); },
  });

  return (
    <Sheet title="Πελάτης" onClose={onClose} right={{ label: 'Επεξεργασία', onClick: () => onEdit(client) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3>{client.name}</h3>
        {flagged && <span className="warn">Παρόμοιο όνομα στη Blacklist: «{flagged.name}»{flagged.comment ? ` — ${flagged.comment}` : ''}</span>}
      </div>

      <div className="paybox">
        <div className="amt">
          {unpaid.length}
          <small>{unpaid.length === 1 ? 'απλήρωτη παραγγελία' : 'απλήρωτες παραγγελίες'}</small>
        </div>
        <button className="btn btn-go" onClick={() => newOrder({ clientId: client.id })}><Plus size={16} /> Παραγγελία</button>
      </div>

      <dl className="kv">
        {client.contactPerson && <div><dt>Υπεύθυνος</dt><dd>{client.contactPerson}</dd></div>}
        {client.phone && <div><dt>Τηλέφωνο</dt><dd className="mono"><a href={`tel:${client.phone}`}>{client.phone}</a></dd></div>}
        {client.email && <div><dt>Email</dt><dd><a href={`mailto:${client.email}`}>{client.email}</a></dd></div>}
        {client.afm && <div><dt>ΑΦΜ</dt><dd className="mono">{client.afm}</dd></div>}
        {client.address && <div><dt>Διεύθυνση</dt><dd>{client.address}</dd></div>}
        <div><dt>Σύνολο παλετών</dt><dd className="mono">{totalPallets}</dd></div>
        {gap && <div><dt>Παραγγέλνει συνήθως</dt><dd className="mono">κάθε ~{gap} ημ.</dd></div>}
      </dl>
      {client.notes && <div className="notes">{client.notes}</div>}

      {prices.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sec"><h2>Τελευταίες τιμές</h2></div>
          <dl className="kv">
            {prices.map(p => (
              <div key={p.name}><dt className="mono" style={{ fontSize: 12 }}>{p.name}</dt><dd className="mono">{money(parseFloat(p.price))} <span className="hint">{formatShort(p.date)}</span></dd></div>
            ))}
          </dl>
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="sec" style={{ marginBottom: 6 }}><h2>Ιστορικό</h2><small>{history.length} παραγγελίες</small></div>
        {history.length === 0 && <span className="hint">Δεν υπάρχουν παραγγελίες.</span>}
        {history.map(o => {
          const st = orderStatus(o);
          return (
            <button key={o.id} className="order" onClick={() => openOrder(o.id)}>
              <span className="day"><b>{(o.orderDate || '').slice(8, 10)}</b><small>{(o.orderDate || '').slice(5, 7)}.{(o.orderDate || '').slice(2, 4)}</small></span>
              <span className="who mono" style={{ fontSize: 12.5 }}>{o.product}</span>
              <span className="prod"><span className={`pill ${st.cls}`}>{st.text}</span></span>
              <span className="qty"><b>{o.amount || '—'}</b><small>{o.agreedPrice !== '' ? money(parseFloat(o.agreedPrice)) : '—'}</small></span>
            </button>
          );
        })}
      </section>

      <button className="btn btn-danger" onClick={handleDelete}>Διαγραφή πελάτη</button>
    </Sheet>
  );
}
