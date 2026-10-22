import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { migrate } from './lib/backup';

const AppContext = createContext(null);

// v2 uses its own keys so it never reads or writes the original app's data
// (both versions are served from the same origin on GitHub Pages).
const KEYS = {
  clients: 'yz2_clients',
  orders: 'yz2_orders',
  blacklist: 'yz2_blacklist',
  dismissed: 'yz2_dismissed',
  lastBackupAt: 'yz2_last_backup_at',
};

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Αποτυχία αποθήκευσης', key, err);
  }
}

function newId() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function loadInitial() {
  return migrate({
    clients: loadFromStorage(KEYS.clients, []),
    orders: loadFromStorage(KEYS.orders, []),
    blacklist: loadFromStorage(KEYS.blacklist, []),
    dismissed: loadFromStorage(KEYS.dismissed, []),
  });
}

export function AppProvider({ children }) {
  const [initial] = useState(loadInitial);
  const [clients, setClients] = useState(initial.clients);
  const [orders, setOrders] = useState(initial.orders);
  const [blacklist, setBlacklist] = useState(initial.blacklist);
  const [dismissed, setDismissed] = useState(initial.dismissed);
  const [lastBackupAt, setLastBackupAt] = useState(() => loadFromStorage(KEYS.lastBackupAt, null));
  const [persisted, setPersisted] = useState(null);

  useEffect(() => { saveToStorage(KEYS.clients, clients); }, [clients]);
  useEffect(() => { saveToStorage(KEYS.orders, orders); }, [orders]);
  useEffect(() => { saveToStorage(KEYS.blacklist, blacklist); }, [blacklist]);
  useEffect(() => { saveToStorage(KEYS.dismissed, dismissed); }, [dismissed]);
  useEffect(() => { saveToStorage(KEYS.lastBackupAt, lastBackupAt); }, [lastBackupAt]);

  // Ask the browser not to evict our storage under pressure.
  useEffect(() => {
    if (!navigator.storage?.persist) return;
    navigator.storage.persisted()
      .then(already => already || navigator.storage.persist())
      .then(setPersisted)
      .catch(() => setPersisted(false));
  }, []);

  // Clients CRUD
  const addClient = useCallback((client) => {
    const newClient = { ...client, id: newId() };
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
    const newEntry = { ...entry, id: newId() };
    setBlacklist(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updateBlacklistEntry = useCallback((id, updates) => {
    setBlacklist(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteBlacklistEntry = useCallback((id) => {
    setBlacklist(prev => prev.filter(c => c.id !== id));
  }, []);

  const dismiss = useCallback((id) => {
    setDismissed(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  // Orders CRUD (soft-delete via archived flag)
  const addOrder = useCallback((order) => {
    const newOrder = { ...order, id: newId(), archived: false, archivedAt: null, paid: false, paidAt: null, createdAt: new Date().toISOString() };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  }, []);

  const updateOrder = useCallback((id, updates) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const setOrderPaid = useCallback((id, paid) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paid, paidAt: paid ? new Date().toISOString() : null } : o));
  }, []);

  // Marks every unpaid order with a deadline on or before `ymd` as paid.
  const markPaidUntil = useCallback((ymd) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => {
      if (o.paid || !o.paymentDeadlineDate || o.paymentDeadlineDate > ymd) return o;
      return { ...o, paid: true, paidAt: now };
    }));
  }, []);

  const renameProducts = useCallback((fromNames, toName) => {
    const set = new Set(fromNames);
    setOrders(prev => prev.map(o => set.has(o.product) ? { ...o, product: toName } : o));
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

  const replaceAll = useCallback((data) => {
    setClients(data.clients);
    setOrders(data.orders);
    setBlacklist(data.blacklist);
    setDismissed(data.dismissed);
  }, []);

  const markBackedUp = useCallback(() => setLastBackupAt(new Date().toISOString()), []);

  return (
    <AppContext.Provider value={{
      clients, addClient, updateClient, deleteClient,
      orders, addOrder, updateOrder, setOrderPaid, markPaidUntil, renameProducts,
      archiveOrder, restoreOrder, permanentDeleteOrder,
      blacklist, addBlacklistEntry, updateBlacklistEntry, deleteBlacklistEntry,
      dismissed, dismiss,
      replaceAll, lastBackupAt, markBackedUp, persisted,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
