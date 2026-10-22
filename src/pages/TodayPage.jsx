import React, { useMemo, useState } from 'react';
import { Plus, Phone, X, AlarmClock } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI, dueText, pallets } from '../ui';
import { paymentAlerts, reorderAlerts, reorderAlertId, typicalGap } from '../lib/alerts';
import { addDays, daysFromToday, formatShort, longToday, todayYMD } from '../lib/dates';

const MONTH_INITIALS = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
const SHOW = 6;

function lastMonths(n) {
  const t = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
    out.push({ ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, initial: MONTH_INITIALS[d.getMonth()], month: d.getMonth() });
  }
  return out;
}

export default function TodayPage() {
  const { orders, clients, dismissed, setOrderPaid, updateOrder, dismiss, lastBackupAt } = useApp();
  const { newOrder, openOrder, toast, goTo } = useUI();
  const [selectedYm, setSelectedYm] = useState(() => todayYMD().slice(0, 7));
  const [allPayments, setAllPayments] = useState(false);
  const [allCalls, setAllCalls] = useState(false);

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const name = (id) => clientById.get(id)?.name || 'Άγνωστος πελάτης';

  const months = useMemo(() => {
    const active = orders.filter(o => !o.archived);
    return lastMonths(6).map(m => ({
      ...m,
      total: active.filter(o => (o.orderDate || '').startsWith(m.ym)).reduce((s, o) => s + pallets(o), 0),
    }));
  }, [orders]);
  const maxMonth = Math.max(1, ...months.map(m => m.total));
  const selected = months.find(m => m.ym === selectedYm) || months[months.length - 1];
  const year = selectedYm.slice(0, 4);
  const yearTotal = useMemo(
    () => orders.filter(o => !o.archived && (o.orderDate || '').startsWith(year)).reduce((s, o) => s + pallets(o), 0),
    [orders, year]
  );

  const payments = useMemo(() => paymentAlerts(orders), [orders]);
  const calls = useMemo(() => reorderAlerts(orders, dismissed), [orders, dismissed]);
  const overdueCount = payments.filter(p => p.days < 0).length;
  const backupAge = lastBackupAt ? daysFromToday(lastBackupAt.slice(0, 10)) * -1 : null;
  const empty = orders.length === 0 && clients.length === 0;

  const markPaid = (order) => {
    setOrderPaid(order.id, true);
    toast(`${name(order.clientId)}: εξοφλήθηκε`, () => setOrderPaid(order.id, false));
  };

  const snooze = (order) => {
    const prev = order.expectedReorderDate;
    updateOrder(order.id, { expectedReorderDate: addDays(todayYMD(), 30) });
    toast('Αναβολή για 30 ημέρες', () => updateOrder(order.id, { expectedReorderDate: prev }));
  };

  return (
    <div className="page">
      <header className="head">
        <div className="head-row">
          <div>
            <div className="kicker">{longToday()}</div>
            <h1>Σήμερα</h1>
          </div>
          <button className="fab" aria-label="Νέα παραγγελία" onClick={() => newOrder()}><Plus size={22} /></button>
        </div>
      </header>

      <div className="body">
        {empty ? (
          <div className="empty">
            <b>Δεν υπάρχουν ακόμα δεδομένα</b>
            <span>Φέρτε τα δεδομένα από το backup της προηγούμενης έκδοσης ή ξεκινήστε με μια νέα παραγγελία.</span>
            <button className="btn btn-go" onClick={() => goTo('data')}>Εισαγωγή backup</button>
          </div>
        ) : (
          <>
            {(backupAge === null || backupAge >= 7) && (
              <div className="notice">
                <div>
                  <b>{backupAge === null ? 'Δεν έχει γίνει backup' : `Τελευταίο backup πριν ${backupAge} ημέρες`}</b>
                  Τα δεδομένα υπάρχουν μόνο σε αυτό το κινητό.
                </div>
                <button className="btn btn-sm btn-ink" onClick={() => goTo('data')}>Backup</button>
              </div>
            )}

            <section className="tally" aria-label="Παλέτες ανά μήνα">
              <div>
                <div className="big">{selected.total}</div>
                <div className="lbl">παλέτες · {new Date(selected.ym + '-01T12:00').toLocaleString('el-GR', { month: 'long' })}</div>
              </div>
              <div className="bars">
                {months.map(m => (
                  <button key={m.ym} className="bar" aria-pressed={m.ym === selected.ym} onClick={() => setSelectedYm(m.ym)}
                    aria-label={`${m.ym}: ${m.total} παλέτες`}>
                    <i style={{ height: `${(m.total / maxMonth) * 100}%` }} />
                    <span>{m.initial}</span>
                  </button>
                ))}
              </div>
              <div className="sub"><span>Σύνολο {year}</span><b className="mono">{yearTotal} παλ.</b></div>
            </section>

            {overdueCount >= 10 && (
              <div className="notice">
                <div>
                  <b>{overdueCount} πληρωμές εμφανίζονται ληξιπρόθεσμες</b>
                  Αν οι παλιές έχουν ήδη εξοφληθεί, σημειώστε τις όλες μαζί.
                </div>
                <button className="btn btn-sm btn-ink" onClick={() => goTo('data')}>Τακτοποίηση</button>
              </div>
            )}

            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sec">
                <h2>Πληρωμές</h2>
                {payments.length > 0 ? <small>{payments.length} εκκρεμούν</small> : <small>καμία εκκρεμότητα</small>}
              </div>
              {payments.length > 0 && (
                <div className="group">
                  {(allPayments ? payments : payments.slice(0, SHOW)).map(({ order, days }) => (
                    <div className="task" key={order.id}>
                      <button className="task-main" onClick={() => openOrder(order.id)}>
                        <span className="who">{name(order.clientId)}</span>
                        <span className="what">
                          <span className={`pill ${days <= 0 ? 'late' : 'soon'}`}>{dueText(days)}</span>
                          <span className="mono">{order.product} · {pallets(order)} παλ.</span>
                        </span>
                      </button>
                      <div className="acts">
                        <button className="btn btn-sm btn-line" onClick={() => markPaid(order)}>Εξοφλήθηκε</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {payments.length > SHOW && (
                <button className="btn btn-quiet btn-sm" onClick={() => setAllPayments(v => !v)}>
                  {allPayments ? 'Λιγότερες' : `Όλες (${payments.length})`}
                </button>
              )}
            </section>

            <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sec">
                <h2>Να πάρω τηλέφωνο</h2>
                {calls.length > 0 ? <small>{calls.length} πελάτες</small> : <small>κανείς σήμερα</small>}
              </div>
              {calls.length > 0 && (
                <div className="group">
                  {(allCalls ? calls : calls.slice(0, SHOW)).map(({ order, days }) => {
                    const c = clientById.get(order.clientId);
                    const gap = typicalGap(orders, order.clientId);
                    return (
                      <div className="task" key={order.id}>
                        <button className="task-main" onClick={() => openOrder(order.id)}>
                          <span className="who">{name(order.clientId)}</span>
                          <span className="what">
                            <span className={`pill ${days < 0 ? 'late' : 'soon'}`}>{dueText(days)}</span>
                            <span>τελευταία {formatShort(order.orderDate)}{gap ? ` · συνήθως ~${gap} ημ.` : ''}</span>
                          </span>
                        </button>
                        <div className="acts">
                          {c?.phone && <a className="btn btn-sm btn-go" href={`tel:${c.phone}`} aria-label={`Κλήση ${c.name}`}><Phone size={14} /></a>}
                          <button className="icon-btn" aria-label="Αναβολή 30 ημερών" onClick={() => snooze(order)}><AlarmClock size={17} /></button>
                          <button className="icon-btn" aria-label="Απόκρυψη" onClick={() => { dismiss(reorderAlertId(order)); toast('Η υπενθύμιση κρύφτηκε'); }}><X size={17} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {calls.length > SHOW && (
                <button className="btn btn-quiet btn-sm" onClick={() => setAllCalls(v => !v)}>
                  {allCalls ? 'Λιγότεροι' : `Όλοι (${calls.length})`}
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
