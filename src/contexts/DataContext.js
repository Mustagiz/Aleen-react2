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

  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);

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

    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      setPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      unsubVendors();
      unsubPurchases();
      unsubExpenses();
      unsubProfile();
      unsubCategories();
    };
  }, []);

  // One-time migration from LocalStorage to Cloud (Kept as is)
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

  const bulkAddInventory = async (items) => {
    const batch = writeBatch(db);
    items.forEach(item => {
      const id = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
      const docRef = doc(db, 'inventory', id);
      batch.set(docRef, { ...item, id, dateAdded: new Date().toISOString() });
    });
    await batch.commit();
  };

  // Vendor Functions
  const addVendor = async (vendor) => {
    const id = Date.now().toString();
    const newVendor = { ...vendor, id, dateAdded: new Date().toISOString(), balance: 0 };
    await setDoc(doc(db, 'vendors', id), newVendor);
  };

  const updateVendor = async (id, updates) => {
    await updateDoc(doc(db, 'vendors', id), updates);
  };

  const deleteVendor = async (id) => {
    await deleteDoc(doc(db, 'vendors', id));
  };

  // Purchase Functions
  const addPurchase = async (purchase) => {
    const id = Date.now().toString();
    const newPurchase = { ...purchase, id, dateAdded: new Date().toISOString() };
    const batch = writeBatch(db);

    batch.set(doc(db, 'purchases', id), newPurchase);

    // If Received, update inventory stock and cost
    if (purchase.status === 'Received') {
      for (const item of purchase.items) {
        const invItem = inventory.find(i => i.id === item.productId);
        const invRef = doc(db, 'inventory', item.productId);

        if (invItem) {
          // Weighted Average Cost Calculation
          const currentQty = invItem.quantity || 0;
          const currentCost = invItem.cost || 0;
          const newQty = item.quantity;
          const newCost = item.cost; // Purchase cost per unit

          const totalValue = (currentQty * currentCost) + (newQty * newCost);
          const totalQty = currentQty + newQty;
          const weightedCost = totalQty > 0 ? totalValue / totalQty : newCost;

          batch.update(invRef, {
            quantity: totalQty,
            cost: parseFloat(weightedCost.toFixed(2))
          });
        }
      }
    }

    // Update Vendor Balance (if unpaid/partial)
    if (purchase.vendorId) {
      const vendorRef = doc(db, 'vendors', purchase.vendorId);
      const currentVendor = vendors.find(v => v.id === purchase.vendorId);
      const pendingAmount = purchase.total - (purchase.amountPaid || 0);

      if (currentVendor && pendingAmount > 0) {
        batch.update(vendorRef, {
          balance: (currentVendor.balance || 0) + pendingAmount
        });
      }
    }

    await batch.commit();
  };

  const updatePurchase = async (id, updates, oldPurchase) => {
    const batch = writeBatch(db);
    const purchaseRef = doc(db, 'purchases', id);
    batch.update(purchaseRef, updates);

    // Handle Status Change: Ordered -> Received
    if (oldPurchase.status !== 'Received' && updates.status === 'Received') {
      for (const item of oldPurchase.items) {
        const invItem = inventory.find(i => i.id === item.productId);
        const invRef = doc(db, 'inventory', item.productId);

        if (invItem) {
          const currentQty = invItem.quantity || 0;
          const currentCost = invItem.cost || 0;
          const newQty = item.quantity;
          const newCost = item.cost;

          const totalValue = (currentQty * currentCost) + (newQty * newCost);
          const totalQty = currentQty + newQty;
          const weightedCost = totalQty > 0 ? totalValue / totalQty : newCost;

          batch.update(invRef, {
            quantity: totalQty,
            cost: parseFloat(weightedCost.toFixed(2))
          });
        }
      }
    }

    // Handle Vendor Balance Update
    // Recalculate Vendor Balance by querying all pending POs
    // Differential updates are fragile. Recalculation is self-correcting.
    if (oldPurchase.vendorId) {
      const vendorRef = doc(db, 'vendors', oldPurchase.vendorId);

      // 1. Get all other purchases for this vendor (using current state 'purchases')
      const otherPurchases = purchases.filter(p => p.vendorId === oldPurchase.vendorId && p.id !== id);

      // 2. Calculate pending for other purchases
      let totalPending = otherPurchases.reduce((sum, p) => {
        return sum + (p.total - (p.amountPaid || 0));
      }, 0);

      // 3. Add pending for THIS updated purchase
      const newTotal = updates.total !== undefined ? updates.total : (oldPurchase.total || 0);
      const newPaid = updates.amountPaid !== undefined ? updates.amountPaid : (oldPurchase.amountPaid || 0);
      const newPending = newTotal - newPaid;

      totalPending += newPending;

      // 4. Update Vendor Balance
      batch.update(vendorRef, {
        balance: totalPending > 0 ? totalPending : 0
      });
    }

    await batch.commit();
  };

  const deletePurchase = async (id) => {
    await deleteDoc(doc(db, 'purchases', id));
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

  // Expense Functions
  const addExpense = async (expense) => {
    const id = Date.now().toString();
    const newExpense = { ...expense, id, dateAdded: new Date().toISOString() };
    await setDoc(doc(db, 'expenses', id), newExpense);
  };

  const updateExpense = async (id, updates) => {
    await updateDoc(doc(db, 'expenses', id), updates);
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  return (
    <DataContext.Provider value={{
      inventory,
      invoices,
      categories,
      vendors,
      purchases,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      bulkAddInventory,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      profile,
      updateProfile,
      updateCategories,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addVendor,
      updateVendor,
      deleteVendor,
      addPurchase,
      updatePurchase,
      deletePurchase,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense
    }}>
      {children}
    </DataContext.Provider>
  );
};
