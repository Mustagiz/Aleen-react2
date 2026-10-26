/**
 * Catalog Repository (Deep Seam)
 * Encapsulates inventory retrieval, barcode lookup, variant resolution, and stock adjustments.
 */
import { db } from '../firebase';
import { collection, doc, updateDoc, getDoc } from 'firebase/firestore';

export const CatalogRepository = {
  /**
   * Resolves an item from inventory by primary ID or variant barcode
   */
  resolveItemByBarcode(barcode, inventory = []) {
    if (!barcode) return null;
    const cleanCode = String(barcode).trim();

    // 1. Direct SKU / ID match
    const directMatch = inventory.find(i => 
      String(i.id) === cleanCode || 
      String(i.sku || '').toLowerCase() === cleanCode.toLowerCase()
    );
    if (directMatch) return { item: directMatch, variant: null };

    // 2. Variant SKU match
    for (const inv of inventory) {
      if (inv.hasVariants && Array.isArray(inv.variants)) {
        const variant = inv.variants.find(v => 
          String(v.sku || '').toLowerCase() === cleanCode.toLowerCase() ||
          String(v.barcode || '').toLowerCase() === cleanCode.toLowerCase()
        );
        if (variant) {
          return { item: inv, variant };
        }
      }
    }

    return null;
  },

  /**
   * Filters catalog for items below minimum stock threshold
   */
  getLowStockItems(inventory = [], threshold = 5) {
    return inventory.filter(item => {
      const stock = Number(item.quantity ?? item.stock ?? 0);
      return stock <= threshold;
    });
  },

  /**
   * Applies stock decrements safely
   */
  async applyStockDelta(itemId, delta, variantSku = null) {
    try {
      const ref = doc(db, 'inventory', itemId);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      const currentStock = Number(data.quantity || 0);
      const newStock = Math.max(0, currentStock + delta);

      let updates = { quantity: newStock, updatedAt: new Date().toISOString() };

      if (variantSku && data.hasVariants && Array.isArray(data.variants)) {
        const updatedVariants = data.variants.map(v => {
          if (v.sku === variantSku) {
            const vStock = Number(v.quantity || 0);
            return { ...v, quantity: Math.max(0, vStock + delta) };
          }
          return v;
        });
        updates.variants = updatedVariants;
      }

      await updateDoc(ref, updates);
      return { id: itemId, ...data, ...updates };
    } catch (err) {
      console.error('CatalogRepository.applyStockDelta error:', err);
      throw err;
    }
  }
};
