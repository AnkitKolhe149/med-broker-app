import React, { useEffect, useMemo, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useNotification } from '../../context/NotificationContext';
import inventoryService from '../../services/inventory.service';
import styles from './StockManager.module.css';

function VendorStockManager() {
  const { showError, showSuccess } = useNotification();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const result = await inventoryService.getInventory({ page: 1, limit: 200 });
        const mapped = (result.items || []).map((item) => ({
          id: item.id,
          medicineName: item.medicine?.name || 'Unknown medicine',
          stock: item.quantity || 0,
          draftStock: String(item.quantity || 0),
          imageUrl: item.imageUrl || null,
          updatedAt: item.updatedAt || null
        }));
        setInventory(mapped);
      } catch (error) {
        console.error('Failed to load stock inventory:', error);
        showError(error?.response?.data?.message || 'Failed to load stock inventory');
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [showError]);

  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = inventory;

    // Filter by search query
    if (q) {
      result = result.filter((item) => item.medicineName.toLowerCase().includes(q));
    }

    // Filter by low stock if enabled
    if (filterLowStock) {
      result = result.filter((item) => item.stock <= 20);
    }

    return result;
  }, [inventory, search, filterLowStock]);

  const updateDraftStock = (inventoryId, value) => {
    setInventory((prev) => prev.map((item) => (
      item.id === inventoryId ? { ...item, draftStock: value } : item
    )));
  };

  const saveStock = async (inventoryId) => {
    const row = inventory.find((item) => item.id === inventoryId);
    if (!row) return;

    const nextQuantity = Number.parseInt(row.draftStock, 10);
    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      showError('Stock must be a non-negative whole number');
      return;
    }

    try {
      setSavingId(inventoryId);
      const updated = await inventoryService.updateInventoryItem(inventoryId, { quantity: nextQuantity });

      setInventory((prev) => prev.map((item) => (
        item.id === inventoryId
          ? {
            ...item,
            stock: updated.quantity,
            draftStock: String(updated.quantity),
            updatedAt: updated.updatedAt || new Date().toISOString()
          }
          : item
      )));

      showSuccess('Stock updated');
    } catch (error) {
      console.error('Failed to update stock:', error);
      showError(error?.response?.data?.message || 'Failed to update stock');
    } finally {
      setSavingId(null);
    }
  };

  const adjustStock = (inventoryId, delta) => {
    setInventory((prev) => prev.map((item) => {
      if (item.id !== inventoryId) return item;
      const current = Number.parseInt(item.draftStock, 10);
      const normalized = Number.isInteger(current) ? current : item.stock;
      return {
        ...item,
        draftStock: String(Math.max(0, normalized + delta))
      };
    }));
  };

  const stockSummary = useMemo(() => {
    const totalItems = inventory.length;
    const outOfStock = inventory.filter((item) => item.stock === 0).length;
    const lowStock = inventory.filter((item) => item.stock > 0 && item.stock <= 20).length;

    return { totalItems, outOfStock, lowStock };
  }, [inventory]);

  return (
    <div className={styles.container}>
      <VendorPageShell
        title="Stock Manager"
        subtitle="Update medicine quantities in real time for your store"
      >
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Total Medicines</p>
            <p className={styles.summaryValue}>{stockSummary.totalItems}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Low Stock</p>
            <p className={styles.summaryValue}>{stockSummary.lowStock}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Out of Stock</p>
            <p className={styles.summaryValue}>{stockSummary.outOfStock}</p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medicine by name"
            className={styles.searchInput}
          />
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterButton} ${filterLowStock ? styles.filterButtonActive : ''}`}
              onClick={() => setFilterLowStock(!filterLowStock)}
            >
              {filterLowStock ? '✓ Low Stock Only' : 'Show Low Stock'}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          {loading ? (
            <div className={styles.loadingState}>Loading stock records...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Medicine</th>
                  <th className={styles.tableHeader}>Current Stock</th>
                  <th className={styles.tableHeader}>Adjust</th>
                  <th className={styles.tableHeader}>Set Exact Stock</th>
                  <th className={styles.tableHeader}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>No medicine found for this search.</td>
                  </tr>
                ) : filteredInventory.map((item) => (
                  <tr key={item.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <div className={styles.nameCell}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.medicineName} className={styles.thumbnail} />
                        ) : (
                          <div className={styles.thumbnailPlaceholder}>No image</div>
                        )}
                        <span>{item.medicineName}</span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={item.stock > 20 ? styles.stockHealthy : item.stock > 0 ? styles.stockLow : styles.stockEmpty}>
                        {item.stock}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.adjustGroup}>
                        <button type="button" className={styles.adjustButton} onClick={() => adjustStock(item.id, -1)}>-1</button>
                        <button type="button" className={styles.adjustButton} onClick={() => adjustStock(item.id, +1)}>+1</button>
                        <button type="button" className={styles.adjustButton} onClick={() => adjustStock(item.id, +10)}>+10</button>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <input
                        type="number"
                        min="0"
                        className={styles.stockInput}
                        value={item.draftStock}
                        onChange={(event) => updateDraftStock(item.id, event.target.value)}
                      />
                    </td>
                    <td className={styles.tableCell}>
                      <button
                        type="button"
                        className={styles.saveButton}
                        disabled={savingId === item.id}
                        onClick={() => saveStock(item.id)}
                      >
                        {savingId === item.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </VendorPageShell>
    </div>
  );
}

export default VendorStockManager;
