import React, { useState, useCallback } from 'react';
import { useApp } from './AppContext';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import OrdersPage from './pages/OrdersPage';
import BlacklistPage from './pages/BlacklistPage';
import NotificationsPage from './pages/NotificationsPage';
import { Users, ClipboardList, LayoutDashboard, Bell, ShieldBan } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Αρχική', icon: LayoutDashboard },
  { id: 'orders', label: 'Παραγγελίες', icon: ClipboardList },
  { id: 'clients', label: 'Πελάτες', icon: Users },
  { id: 'blacklist', label: 'Blacklist', icon: ShieldBan },
  { id: 'notifications', label: 'Ειδοπ.', icon: Bell, hasBadge: true },
];

export default function App() {
  const { orders, deletedNotifications } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingAddClient, setPendingAddClient] = useState(false);

  const handleGoToOrders = useCallback(() => {
    setActiveTab('orders');
  }, []);

  const handleGoToAddClient = useCallback(() => {
    setActiveTab('clients');
    setPendingAddClient(true);
  }, []);

  const handleClientAdded = useCallback(() => {
    setPendingAddClient(false);
    setActiveTab('orders');
  }, []);

  // Compute notification count
  const notifCount = React.useMemo(() => {
    if (!orders) return 0;
    const now = new Date();
    // Normalize now to start of day for exact day diffs
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getDiffDays = (dateStr) => {
      const dDate = new Date(dateStr);
      const target = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    };

    let count = 0;
    const activeOrders = orders.filter(o => !o.archived);
    
    activeOrders.forEach(o => {
      if (o.paymentDeadlineDate) {
        const id = `pay-${o.id}`;
        if (!deletedNotifications?.includes(id)) {
          const diff = getDiffDays(o.paymentDeadlineDate);
          if (diff <= 7) count++; // overdue or due within 7 days
        }
      }
      if (o.expectedReorderDate) {
        const id = `reorder-${o.id}`;
        if (!deletedNotifications?.includes(id)) {
          const diff = getDiffDays(o.expectedReorderDate);
          if (diff <= 1) count++; // overdue or due tomorrow/today
        }
      }
    });

    return count;
  }, [orders, deletedNotifications]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(79,142,247,0.06) 0%, transparent 55%), var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'dashboard' && <DashboardPage onGoToOrders={handleGoToOrders} />}
        {activeTab === 'clients' && (
          <ClientsPage
            key={pendingAddClient ? 'add-client-mode' : 'normal-mode'}
            autoOpenForm={pendingAddClient}
            onAddClientDone={pendingAddClient ? handleClientAdded : null}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersPage 
            onGoToAddClient={handleGoToAddClient} 
          />
        )}
        {activeTab === 'blacklist' && <BlacklistPage />}
        {activeTab === 'notifications' && <NotificationsPage onGoToOrders={handleGoToOrders} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
              {item.hasBadge && notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '10px',
                  background: 'var(--danger)', color: '#fff',
                  fontSize: '9px', fontWeight: 'bold',
                  padding: '2px 5px', borderRadius: '10px',
                  lineHeight: 1
                }}>
                  {notifCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
