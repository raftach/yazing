import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const DEFAULT_PASSWORD = 'skydraOnTop';

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    return parsed || defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('erp_auth') === 'true';
  });
  const [clients, setClients] = useState(() => loadFromStorage('erp_clients', []));
  const [products, setProducts] = useState(() => loadFromStorage('erp_products', []));
  const [orders, setOrders] = useState(() => loadFromStorage('erp_orders', []));

  useEffect(() => { saveToStorage('erp_clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('erp_products', products); }, [products]);
  useEffect(() => { saveToStorage('erp_orders', orders); }, [orders]);

  const login = useCallback((password) => {
    if (password === DEFAULT_PASSWORD) {
      sessionStorage.setItem('erp_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('erp_auth');
    setIsAuthenticated(false);
  }, []);

  // Clients CRUD
  const addClient = useCallback((client) => {
    const newClient = { ...client, id: Date.now().toString() };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback((id, updates) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteClient = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // Products CRUD
  const addProduct = useCallback((product) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // Orders CRUD (soft-delete via archived flag)
  const addOrder = useCallback((order) => {
    const newOrder = { ...order, id: Date.now().toString(), archived: false, createdAt: new Date().toISOString() };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  }, []);

  const updateOrder = useCallback((id, updates) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const archiveOrder = useCallback((id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, archived: true, archivedAt: new Date().toISOString() } : o));
  }, []);

  const restoreOrder = useCallback((id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, archived: false, archivedAt: null } : o));
  }, []);

  const permanentDeleteOrder = useCallback((id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      clients, addClient, updateClient, deleteClient,
      products, addProduct, updateProduct, deleteProduct,
      orders, addOrder, updateOrder, archiveOrder, restoreOrder, permanentDeleteOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
