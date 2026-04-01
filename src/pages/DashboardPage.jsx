import React, { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { LayoutDashboard, TrendingUp, Package, ChevronRight } from 'lucide-react';

export default function DashboardPage({ onGoToOrders }) {
  const { orders, clients } = useApp();
  const [selectedMonth, setSelectedMonth] = useState('');

  const activeOrders = useMemo(() => (orders || []).filter(o => !o.archived), [orders]);
  
  // Calculate hierarchical years and months
  const filterOptions = useMemo(() => {
    const rawOptions = [];
    const now = new Date();
    let maxYear = now.getFullYear();
    let maxMonth = now.getMonth() + 1; // 1-12

    let minYear = maxYear;
    activeOrders.forEach(o => {
      if (o.orderDate) {
        const y = parseInt(o.orderDate.substring(0, 4), 10);
        if (y && y < minYear) minYear = y;
        if (y && y > maxYear) maxYear = y;
      }
    });

    if (minYear > maxYear - 2) minYear = maxYear - 2; // Show at least 2 years back

    for (let y = maxYear; y >= minYear; y--) {
      // Add the Year Option (e.g. "2025")
      rawOptions.push({ value: String(y), label: String(y) });
      
      // Add the Month Options for this year
      const startMonth = (y === maxYear) ? maxMonth : 12;
      for (let m = startMonth; m >= 1; m--) {
        const diffMonths = (maxYear - y) * 12 + (maxMonth - m);
        // Only show individual months for the last 12 months to keep menu short
        if (diffMonths <= 12) {
          const val = `${y}-${String(m).padStart(2, '0')}`;
          const d = new Date(y, m - 1, 1);
          const str = d.toLocaleString('el-GR', { month: 'long', year: 'numeric' });
          const labelStr = str.charAt(0).toUpperCase() + str.slice(1);
          rawOptions.push({ value: val, label: labelStr });
        }
      }
    }
    return rawOptions;
  }, [activeOrders]);

  const selectedLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const opt = filterOptions.find(o => o.value === selectedMonth);
    return opt ? opt.label.toUpperCase() : '';
  }, [selectedMonth, filterOptions]);

  const filteredOrders = useMemo(() => {
    if (!selectedMonth) return [];
    return activeOrders.filter(o => o.orderDate && o.orderDate.startsWith(selectedMonth));
  }, [activeOrders, selectedMonth]);

  const overallStats = useMemo(() => {
    return { total: activeOrders.length };
  }, [activeOrders]);

  const stats = useMemo(() => {
    return { total: filteredOrders.length };
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return [...activeOrders]
      .sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))
      .slice(0, 5);
  }, [activeOrders]);

  const getClientName = (id) => (clients || []).find(c => c.id === id)?.name || '—';

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1>Αρχική</h1>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '8px', 
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              fontSize: '13px',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">Επιλέξτε Μήνα / Έτος</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
          Καλώς ήρθατε στο Yazing
        </p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedMonth ? '1fr 1fr' : '1fr', gap: '12px' }}>
          <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <LayoutDashboard size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΣΥΝΟΛΙΚΕΣ ΠΑΡΑΓΓΕΛΙΕΣ</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: 8 }}>
              {overallStats.total}
            </div>
          </div>
          
          {selectedMonth && (
            <div className="stat-card" style={{ padding: '16px', background: 'var(--accent-soft)', border: '1px solid rgba(79,142,247,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
                <Package size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΠΑΡΑΓΓΕΛΙΕΣ ({selectedLabel})</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', marginTop: 8 }}>
                {stats.total}
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Πρόσφατες Παραγγελίες</div>
            {onGoToOrders && (
              <button 
                onClick={onGoToOrders}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                Όλες <ChevronRight size={14} />
              </button>
            )}
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Δεν υπάρχουν πρόσφατες παραγγελίες
              </div>
            ) : (
              recentOrders.map((o, i) => (
                <div key={o.id} style={{ 
                  padding: '12px 14px', 
                  borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{getClientName(o.clientId)}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{o.totalPrice ? `${parseFloat(o.totalPrice).toFixed(2)}€` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Package size={12} /> {o.product || '—'} 
                    {(o.amount || o.agreedPrice) && <span style={{ opacity: 0.5 }}>|</span>}
                    {o.amount ? ` Ποσ.: ${o.amount}` : ''}
                    {(o.amount && o.agreedPrice) ? <span style={{ opacity: 0.5 }}>|</span> : ''}
                    {o.agreedPrice ? ` Μονάδα: ${o.agreedPrice}€` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Data & Security Section */}
        <section>
          <div className="section-label" style={{ marginBottom: 12 }}>Δεδομένα & Ασφάλεια</div>
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Δημιουργήστε ένα αντίγραφο ασφαλείας (Backup) όλων των δεδομένων σας στη συσκευή σας. Αν διαγραφεί η εφαρμογή, μπορείτε να επαναφέρετε τα δεδομένα (Restore) ανεβάζοντας αυτό το αρχείο.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '13px', background: 'var(--bg-base)' }}
                onClick={() => {
                    const data = {
                      clients: localStorage.getItem('erp_clients'),
                      blacklist: localStorage.getItem('erp_blacklist'),
                      orders: localStorage.getItem('erp_orders')
                    };
                    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `logitap_backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Εξαγωγή (Backup)
              </button>
              
              <label className="btn btn-primary" style={{ flex: 1, fontSize: '13px', textAlign: 'center', cursor: 'pointer', margin: 0 }}>
                Εισαγωγή (Restore)
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (data.clients && data.orders) {
                          localStorage.setItem('erp_clients', data.clients);
                          if (data.blacklist) localStorage.setItem('erp_blacklist', data.blacklist);
                          localStorage.setItem('erp_orders', data.orders);
                          alert('Η επαναφορά ολοκληρώθηκε! Η σελίδα θα ανανεωθεί.');
                          window.location.reload();
                        } else {
                          alert('To αρχείο δεν είναι έγκυρο αρχείο backup του Yazing.');
                        }
                      } catch (err) {
                        alert('Σφάλμα κατά την ανάγνωση.');
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
