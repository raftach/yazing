import React, { useMemo, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useApp } from '../AppContext';
import { useUI } from '../ui';
import Sheet from '../components/Sheet';
import { backupFileName, buildBackup, parseBackup, readLegacyData, shareOrDownload } from '../lib/backup';
import { addDays, daysFromToday, formatDate, todayYMD } from '../lib/dates';
import { duplicateGroups } from '../lib/products';

const APP_VERSION = '2.0';

export default function DataPage() {
  const { clients, orders, blacklist, dismissed, lastBackupAt, markBackedUp, replaceAll, markPaidUntil, persisted } = useApp();
  const { toast, confirm } = useUI();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // parsed backup awaiting confirmation
  const [importError, setImportError] = useState('');
  const [paidUntil, setPaidUntil] = useState(() => addDays(todayYMD(), -30));
  const [cleaning, setCleaning] = useState(false);
  const legacy = useMemo(() => readLegacyData(), []);

  const backupAge = lastBackupAt ? -daysFromToday(lastBackupAt.slice(0, 10)) : null;
  const toMark = orders.filter(o => !o.archived && !o.paid && o.paymentDeadlineDate && o.paymentDeadlineDate <= paidUntil).length;
  const dups = useMemo(() => duplicateGroups(orders), [orders]);

  const handleExport = async () => {
    const result = await shareOrDownload(buildBackup({ clients, orders, blacklist, dismissed }), backupFileName());
    if (result !== 'cancelled') {
      markBackedUp();
      toast('Το backup δημιουργήθηκε');
    }
  };

  const loadText = (text) => {
    setImportError('');
    try {
      setPending(parseBackup(text));
    } catch (err) {
      setImportError(err.message);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadText(ev.target.result);
    reader.onerror = () => setImportError('Δεν ήταν δυνατή η ανάγνωση του αρχείου.');
    reader.readAsText(file);
  };

  const applyImport = () => {
    replaceAll(pending);
    const n = pending.orders.length;
    setPending(null);
    toast(`Εισήχθησαν ${n} παραγγελίες`);
  };

  return (
    <div className="page">
      <header className="head">
        <div className="head-row">
          <div>
            <div className="kicker">Yazing {APP_VERSION}</div>
            <h1>Δεδομένα</h1>
          </div>
        </div>
      </header>

      <div className="body">
        <section className="card">
          <h2>Backup</h2>
          <p>
            Όλα τα δεδομένα αποθηκεύονται μόνο σε αυτό το κινητό. Κάντε backup τακτικά και κρατήστε το αρχείο
            στα Αρχεία (iCloud) ή στείλτε το στον εαυτό σας.
          </p>
          <div className="readout">
            <span>Τελευταίο backup</span>
            <b>{lastBackupAt ? `${formatDate(lastBackupAt.slice(0, 10))}${backupAge > 0 ? ` · πριν ${backupAge} ημ.` : ' · σήμερα'}` : 'ποτέ'}</b>
          </div>
          <button className="btn btn-go btn-block" onClick={handleExport}><Download size={16} /> Δημιουργία backup</button>
        </section>

        <section className="card">
          <h2>Επαναφορά από backup</h2>
          <p>Δέχεται αρχεία και από την προηγούμενη έκδοση (logitap_backup_…json). Πριν την αντικατάσταση θα δείτε τι περιέχει.</p>
          <input ref={fileRef} id="import-file" type="file" accept=".json,application/json" hidden onChange={handleFile} />
          <button className="btn btn-ink btn-block" onClick={() => fileRef.current.click()}><Upload size={16} /> Επιλογή αρχείου</button>
          {legacy && (
            <button className="btn btn-line btn-block" onClick={() => loadText(legacy)}>
              Μεταφορά από την παλιά έκδοση σε αυτή τη συσκευή
            </button>
          )}
          {importError && <span className="warn">{importError}</span>}
        </section>

        <section className="card">
          <h2>Μαζική εξόφληση</h2>
          <p>Σημειώνει ως εξοφλημένες όλες τις απλήρωτες παραγγελίες με λήξη πληρωμής έως την ημερομηνία που επιλέγετε.</p>
          <div className="field">
            <label htmlFor="paid-until">Λήξη έως</label>
            <input id="paid-until" type="date" className="input mono" value={paidUntil} onChange={e => setPaidUntil(e.target.value)} />
          </div>
          <button className="btn btn-ink btn-block" disabled={!toMark || !paidUntil} onClick={() => confirm({
            title: 'Μαζική εξόφληση',
            text: `${toMark} παραγγελίες με λήξη έως ${formatDate(paidUntil)} θα σημειωθούν ως εξοφλημένες.\nΜπορείτε να αλλάξετε μεμονωμένες αργότερα.`,
            action: 'Σημείωση',
            onConfirm: () => { markPaidUntil(paidUntil); toast(`${toMark} παραγγελίες σημειώθηκαν ως εξοφλημένες`); },
          })}>
            Σημείωση {toMark} παραγγελιών
          </button>
        </section>

        <section className="card">
          <h2>Ονόματα προϊόντων</h2>
          <p>
            {dups.length
              ? `${dups.length} προϊόντα έχουν γραφτεί με διαφορετικούς τρόπους (κενά, τελείες, παύλες). Ενοποιήστε τα για σωστή αυτόματη τιμή και ιστορικό.`
              : 'Δεν βρέθηκαν διπλότυπα ονόματα προϊόντων.'}
          </p>
          {dups.length > 0 && <button className="btn btn-ink btn-block" onClick={() => setCleaning(true)}>Έλεγχος {dups.length} προϊόντων</button>}
        </section>

        <section className="card">
          <h2>Αποθήκευση</h2>
          <dl className="kv">
            <div><dt>Πελάτες</dt><dd className="mono">{clients.length}</dd></div>
            <div><dt>Παραγγελίες</dt><dd className="mono">{orders.length}</dd></div>
            <div><dt>Blacklist</dt><dd className="mono">{blacklist.length}</dd></div>
            <div><dt>Μόνιμη αποθήκευση</dt><dd>{persisted === null ? '—' : persisted ? 'Ναι' : 'Όχι (κάντε συχνά backup)'}</dd></div>
          </dl>
        </section>
      </div>

      {pending && (
        <Sheet title="Επαναφορά" onClose={() => setPending(null)} short left={{ label: 'Άκυρο', onClick: () => setPending(null) }}>
          <h3>Αντικατάσταση δεδομένων;</h3>
          <dl className="kv">
            <div><dt>Στο αρχείο</dt><dd className="mono">{pending.clients.length} πελ. · {pending.orders.length} παρ. · {pending.blacklist.length} bl.</dd></div>
            <div><dt>Τώρα στο κινητό</dt><dd className="mono">{clients.length} πελ. · {orders.length} παρ. · {blacklist.length} bl.</dd></div>
            {pending.report.fromVersion === 1 && <div><dt>Μορφή</dt><dd>Προηγούμενη έκδοση</dd></div>}
            {pending.report.fixedDeadlines > 0 && <div><dt>Διορθωμένες λήξεις</dt><dd className="mono">{pending.report.fixedDeadlines}</dd></div>}
          </dl>
          {pending.report.fixedDeadlines > 0 && (
            <p className="hint">Η προηγούμενη έκδοση υπολόγιζε μερικές λήξεις πληρωμής μία ημέρα λάθος. Διορθώνονται αυτόματα.</p>
          )}
          {orders.length > 0 && <span className="warn">Τα τρέχοντα δεδομένα του κινητού θα αντικατασταθούν. Κάντε πρώτα backup αν τα χρειάζεστε.</span>}
          <div className="sheet-foot">
            <button className="btn btn-quiet" onClick={() => setPending(null)}>Άκυρο</button>
            <button className="btn btn-go" onClick={applyImport}>Αντικατάσταση</button>
          </div>
        </Sheet>
      )}

      {cleaning && <ProductCleanup groups={dups} onClose={() => setCleaning(false)} />}
    </div>
  );
}

function ProductCleanup({ groups, onClose }) {
  const { orders, renameProducts } = useApp();
  const { toast } = useUI();
  const [choice, setChoice] = useState(() => Object.fromEntries(groups.map(g => [g.key, g.name])));
  const [done, setDone] = useState(() => new Set());

  const countOf = (name) => orders.filter(o => o.product === name).length;

  const merge = (g) => {
    const target = choice[g.key];
    renameProducts(g.variants.filter(v => v !== target), target);
    setDone(d => new Set(d).add(g.key));
    toast(`Ενοποιήθηκε ως ${target}`);
  };

  return (
    <Sheet title="Ονόματα προϊόντων" onClose={onClose}>
      <p className="hint">Επιλέξτε τη σωστή γραφή για κάθε προϊόν. Όλες οι παραγγελίες θα πάρουν αυτό το όνομα.</p>
      {groups.map(g => (
        <div key={g.key} className="dup" style={{ borderBottom: '1px solid var(--rule)', opacity: done.has(g.key) ? 0.45 : 1 }}>
          {g.variants.map(v => (
            <label key={v}>
              <input type="radio" name={`dup-${g.key}`} checked={choice[g.key] === v} disabled={done.has(g.key)}
                onChange={() => setChoice(c => ({ ...c, [g.key]: v }))} />
              <span style={{ flex: 1 }}>{v}</span>
              <span className="hint">{countOf(v)}×</span>
            </label>
          ))}
          <button className="btn btn-sm btn-ink" style={{ alignSelf: 'flex-start' }} disabled={done.has(g.key)} onClick={() => merge(g)}>
            {done.has(g.key) ? 'Έγινε' : 'Ενοποίηση'}
          </button>
        </div>
      ))}
    </Sheet>
  );
}
