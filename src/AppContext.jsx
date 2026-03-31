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
  const [clients, setClients] = useState(() => loadFromStorage('erp_clients', []));
  const [orders, setOrders] = useState(() => loadFromStorage('erp_orders', []));
  const [blacklist, setBlacklist] = useState(() => loadFromStorage('erp_blacklist', []));
  const [deletedNotifications, setDeletedNotifications] = useState(() => loadFromStorage('erp_deleted_notifs', []));

  useEffect(() => { saveToStorage('erp_clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('erp_orders', orders); }, [orders]);
  useEffect(() => { saveToStorage('erp_blacklist', blacklist); }, [blacklist]);
  useEffect(() => { saveToStorage('erp_deleted_notifs', deletedNotifications); }, [deletedNotifications]);

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

  // Blacklist CRUD
  const addBlacklistEntry = useCallback((entry) => {
    const newEntry = { ...entry, id: Date.now().toString() };
    setBlacklist(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updateBlacklistEntry = useCallback((id, updates) => {
    setBlacklist(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteBlacklistEntry = useCallback((id) => {
    setBlacklist(prev => prev.filter(c => c.id !== id));
  }, []);

  const markNotificationDeleted = useCallback((id) => {
    setDeletedNotifications(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
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
      clients, addClient, updateClient, deleteClient,
      orders, addOrder, updateOrder, archiveOrder, restoreOrder, permanentDeleteOrder,
      blacklist, addBlacklistEntry, updateBlacklistEntry, deleteBlacklistEntry,
      deletedNotifications, markNotificationDeleted,
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
