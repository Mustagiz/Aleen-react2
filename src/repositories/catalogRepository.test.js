jest.mock('../firebase', () => ({ db: {} }));

import { CatalogRepository } from './catalogRepository';

describe('CatalogRepository Module Tests', () => {
  const mockInventory = [
    {
      id: 'SKU-001',
      name: 'Tussar Silk Kurti',
      quantity: 12,
      sku: 'KURTI-TUSSAR'
    },
    {
      id: 'SKU-002',
      name: 'Bridal Dupatta',
      quantity: 3,
      sku: 'DUPATTA-GOLD',
      hasVariants: true,
      variants: [
        { sku: 'DUP-RED-2M', barcode: '8901234567890', quantity: 2 }
      ]
    }
  ];

  test('resolveItemByBarcode finds direct SKU and barcode matches', () => {
    const direct = CatalogRepository.resolveItemByBarcode('SKU-001', mockInventory);
    expect(direct).not.toBeNull();
    expect(direct.item.name).toBe('Tussar Silk Kurti');
    expect(direct.variant).toBeNull();

    const variant = CatalogRepository.resolveItemByBarcode('8901234567890', mockInventory);
    expect(variant).not.toBeNull();
    expect(variant.item.name).toBe('Bridal Dupatta');
    expect(variant.variant.sku).toBe('DUP-RED-2M');

    const notFound = CatalogRepository.resolveItemByBarcode('INVALID-CODE', mockInventory);
    expect(notFound).toBeNull();
  });

  test('getLowStockItems returns items at or below given threshold', () => {
    const lowStock = CatalogRepository.getLowStockItems(mockInventory, 5);
    expect(lowStock).toHaveLength(1);
    expect(lowStock[0].name).toBe('Bridal Dupatta');
  });
});
