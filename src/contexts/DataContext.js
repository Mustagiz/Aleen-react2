import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState(['Sarees', 'Kurtis', 'Lehenga', 'Salwar Suits', 'Dupattas', 'Blouses']);
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

  // Real-time synchronization
  useEffect(() => {
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProfile = onSnapshot(doc(db, 'settings', 'profile'), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      }
    });

    const unsubCategories = onSnapshot(doc(db, 'settings', 'inventory'), (snapshot) => {
      if (snapshot.exists() && snapshot.data().categories) {
        setCategories(snapshot.data().categories);
      }
    });

    return () => {
      unsubInventory();
      unsubInvoices();
      unsubCustomers();
      unsubProfile();
      unsubCategories();
    };
  }, []);

  // One-time migration from LocalStorage to Cloud
  useEffect(() => {
    const migrateData = async () => {
      const hasMigrated = localStorage.getItem('firebase_migrated');
      if (hasMigrated) return;

      const localInv = JSON.parse(localStorage.getItem('inventory') || '[]');
      const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const localProfile = JSON.parse(localStorage.getItem('profile'));
      const localCategories = JSON.parse(localStorage.getItem('categories'));

      if (localInv.length > 0) {
        for (const item of localInv) {
          await setDoc(doc(db, 'inventory', item.id), item);
        }
      }
      if (localInvoices.length > 0) {
        for (const inv of localInvoices) {
          await setDoc(doc(db, 'invoices', inv.id), inv);
        }
      }
      if (localProfile) {
        await setDoc(doc(db, 'settings', 'profile'), localProfile);
      }
      if (localCategories) {
        await setDoc(doc(db, 'settings', 'inventory'), { categories: localCategories });
      }

      localStorage.setItem('firebase_migrated', 'true');
    };

    migrateData();
  }, []);

  const addInventoryItem = async (item) => {
    const id = Date.now().toString();
    const newItem = { ...item, id, dateAdded: new Date().toISOString() };
    await setDoc(doc(db, 'inventory', id), newItem);
  };

  const updateInventoryItem = async (id, updates) => {
    await updateDoc(doc(db, 'inventory', id), updates);
  };

  const deleteInventoryItem = async (id) => {
    await deleteDoc(doc(db, 'inventory', id));
  };

  const addInvoice = async (invoice) => {
    const id = Date.now().toString();
    const newInvoice = { ...invoice, id };

    // Use a batch to ensure inventory update, invoice creation, and customer update are atomic
    const batch = writeBatch(db);
    batch.set(doc(db, 'invoices', id), newInvoice);

    // Update Inventory
    for (const item of invoice.items) {
      const invRef = doc(db, 'inventory', item.id);
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem) {
        batch.update(invRef, {
          quantity: invItem.quantity - item.quantity
        });
      }
    }

    // Update Customer Stats if linked
    if (invoice.customerId) {
      const customerRef = doc(db, 'customers', invoice.customerId);
      const customer = customers.find(c => c.id === invoice.customerId);
      if (customer) {
        batch.update(customerRef, {
          totalSpent: (customer.totalSpent || 0) + invoice.total,
          visitCount: (customer.visitCount || 0) + 1
        });
      }
    }

    await batch.commit();
  };

  const updateInvoice = async (id, updates) => {
    await updateDoc(doc(db, 'invoices', id), updates);
  };

  const deleteInvoice = async (id) => {
    await deleteDoc(doc(db, 'invoices', id));
  };

  const updateProfile = async (updates) => {
    await setDoc(doc(db, 'settings', 'profile'), { ...profile, ...updates });
  };

  const addCustomer = async (customer) => {
    const id = Date.now().toString();
    const newCustomer = {
      ...customer,
      id,
      dateAdded: new Date().toISOString(),
      totalSpent: 0,
      visitCount: 0
    };
    await setDoc(doc(db, 'customers', id), newCustomer);
    return id;
  };

  const updateCustomer = async (id, updates) => {
    await updateDoc(doc(db, 'customers', id), updates);
  };

  const deleteCustomer = async (id) => {
    await deleteDoc(doc(db, 'customers', id));
  };

  const updateCategories = async (newCategories) => {
    await setDoc(doc(db, 'settings', 'inventory'), { categories: newCategories });
  };

  return (
    <DataContext.Provider value={{
      inventory,
      invoices,
      categories,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      profile,
      updateProfile,
      updateCategories,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer
    }}>
      {children}
    </DataContext.Provider>
  );
};
