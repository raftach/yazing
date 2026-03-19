import React, { useState, useCallback } from 'react';
import { useApp } from './AppContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import { Users, Package, ClipboardList, LogOut, FlaskConical, LayoutDashboard, Bell } from 'lucide-react';


const NAV_ITEMS = [
  { id: 'dashboard', label: 'Αρχική', icon: LayoutDashboard },
  { id: 'orders', label: 'Παραγγελίες', icon: ClipboardList },
  { id: 'products', label: 'Προϊόντα', icon: Package },
  { id: 'clients', label: 'Πελάτες', icon: Users },
  { id: 'notifications', label: 'Ειδοπ.', icon: Bell, hasBadge: true },
];

export default function App() {
  const { isAuthenticated, logout, orders, products } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingAddClient, setPendingAddClient] = useState(false);
  const [pendingAddProduct, setPendingAddProduct] = useState(false);

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

  const handleGoToAddProduct = useCallback(() => {
    setActiveTab('products');
    setPendingAddProduct(true);
  }, []);

  const handleProductAdded = useCallback(() => {
    setPendingAddProduct(false);
    setActiveTab('orders');
  }, []);

  // Compute notification count
  const notifCount = React.useMemo(() => {
    if (!orders || !products) return 0;
    const now = new Date();
    // upcoming payment deadlines (next 7 days) + expected delivery (next 2 days)
    const upcomingPayments = (orders || []).filter(o => !o.archived && o.status !== 'completed' && o.paymentDeadlineDate);
    // basic mock count for now, will calculate properly in NotificationsPage 
    let count = 0;
    upcomingPayments.forEach(o => {
      const pDate = new Date(o.paymentDeadlineDate);
      const diffTime = pDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= -14 && diffDays <= 7) count++;
    });
    const lowStock = (products || []).filter(p => !p.archived && parseFloat(p.quantity) < 5);
    return count + lowStock.length;
  }, [orders, products]);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at 20% 0%, rgba(79,142,247,0.06) 0%, transparent 55%), var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            onGoToAddProduct={handleGoToAddProduct}
          />
        )}
        {activeTab === 'products' && (
          <ProductsPage 
            key={pendingAddProduct ? 'add-product-mode' : 'normal-mode'}
            autoOpenForm={pendingAddProduct}
            onAddProductDone={pendingAddProduct ? handleProductAdded : null}
          />
        )}
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
        <button className="nav-item" onClick={logout}>
          <LogOut size={22} strokeWidth={1.8} />
          Έξοδος
        </button>
      </nav>
    </div>
  );
}
