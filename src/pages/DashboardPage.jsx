import React, { useMemo } from 'react';
import { useApp } from '../AppContext';
import { LayoutDashboard, TrendingUp, Clock, CheckCircle2, Package, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DashboardPage({ onGoToOrders }) {
  const { orders, products, clients } = useApp();

  const activeOrders = useMemo(() => (orders || []).filter(o => !o.archived), [orders]);
  
  const stats = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let completed = 0;
    
    activeOrders.forEach(o => {
      if (o.totalPrice) revenue += parseFloat(o.totalPrice);
      if (o.status === 'completed') completed++;
      if (o.status === 'pending' || o.status === 'processing') pending++;
    });
    
    return { revenue: revenue.toFixed(2), pending, completed, total: activeOrders.length };
  }, [activeOrders]);

  const recentOrders = useMemo(() => {
    return [...activeOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [activeOrders]);

  const lowStockProducts = useMemo(() => {
    return (products || []).filter(p => !p.archived && parseFloat(p.quantity) < 5);
  }, [products]);

  const getClientName = (id) => (clients || []).find(c => c.id === id)?.name || '—';

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1>Αρχική</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
          Καλώς ήρθατε στο Yazing
        </p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <TrendingUp size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΣΥΝΟΛΙΚΑ ΕΣΟΔΑ</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', marginTop: 8 }}>
              {stats.revenue}€
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
              <LayoutDashboard size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΠΑΡΑΓΓΕΛΙΕΣ</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: 8 }}>
              {stats.total}
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning-text)' }}>
              <Clock size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΕΚΚΡΕΜΕΙΣ</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: 8 }}>
              {stats.pending}
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success-text)' }}>
              <CheckCircle2 size={15} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>ΟΛΟΚΛΗΡΩΜΕΝΕΣ</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginTop: 8 }}>
              {stats.completed}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {lowStockProducts.length > 0 && (
          <section>
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-text)' }}>
              <AlertTriangle size={15} /> Προειδοποιήσεις Αποθέματος
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {lowStockProducts.map((p, i) => (
                <div key={p.id} style={{ 
                  padding: '12px 14px', 
                  borderBottom: i < lowStockProducts.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Κωδικός: {p.code || '—'}</div>
                  </div>
                  <div className="badge badge-danger">
                    {p.quantity} {p.unit}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                    products: localStorage.getItem('erp_products'),
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
                        if (data.clients && data.products && data.orders) {
                          localStorage.setItem('erp_clients', data.clients);
                          localStorage.setItem('erp_products', data.products);
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
