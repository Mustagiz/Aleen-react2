import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState({
    businessName: 'Aleen Clothing',
    ownerName: 'Admin',
    email: 'admin@aleen.com',
    phone: '+91 98765 43210',
    address: 'Baba Jaan Chawk, Pune, Maharashtra 411001',
    gstin: '27XXXXX1234X1ZX',
    description: 'Premium women\'s clothing store offering the latest fashion trends and timeless classics.',
    established: '2020',
    specialization: 'Women\'s Fashion & Accessories'
  });

  useEffect(() => {
    const savedInventory = localStorage.getItem('inventory');
    const savedInvoices = localStorage.getItem('invoices');
    const savedProfile = localStorage.getItem('profile');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  const addInventoryItem = async (item) => {
    const newItem = { ...item, id: Date.now().toString(), dateAdded: new Date().toISOString() };
    const updated = [...inventory, newItem];
    setInventory(updated);
    localStorage.setItem('inventory', JSON.stringify(updated));
  };

  const updateInventoryItem = async (id, updates) => {
    const updated = inventory.map(item => item.id === id ? { ...item, ...updates } : item);
    setInventory(updated);
    localStorage.setItem('inventory', JSON.stringify(updated));
  };

  const deleteInventoryItem = async (id) => {
    const updated = inventory.filter(item => item.id !== id);
    setInventory(updated);
    localStorage.setItem('inventory', JSON.stringify(updated));
  };

  const addInvoice = async (invoice) => {
    const newInvoice = { ...invoice, id: Date.now().toString() };
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    const updatedInventory = [...inventory];
    for (const item of invoice.items) {
      const invItem = updatedInventory.find(i => i.id === item.id);
      if (invItem) {
        invItem.quantity = invItem.quantity - item.quantity;
      }
    }
    setInventory(updatedInventory);
    localStorage.setItem('inventory', JSON.stringify(updatedInventory));
  };

  const updateInvoice = async (id, updates) => {
    const updated = invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv);
    setInvoices(updated);
    localStorage.setItem('invoices', JSON.stringify(updated));
  };

  const deleteInvoice = async (id) => {
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem('invoices', JSON.stringify(updated));
  };

  const updateProfile = async (updates) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    localStorage.setItem('profile', JSON.stringify(updated));
  };

  return (
    <DataContext.Provider value={{
      inventory,
      invoices,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      profile,
      updateProfile
    }}>
      {children}
    </DataContext.Provider>
  );
};
