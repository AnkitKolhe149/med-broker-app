import React, { useEffect, useMemo, useState } from 'react';
import VendorPageShell from '../../components/layout/VendorPageShell';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotification } from '../../context/NotificationContext';
import orderService from '../../services/order.service';
import { formatCurrency } from '../../utils/currency';
import styles from './Orders.module.css';
import { Clock, CreditCard, Package, X, Check } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'pending', 'paid', 'shipped', 'cancelled'];

function VendorOrders() {
  const { currency, convert } = useCurrency();
  const { showError, showSuccess } = useNotification();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const result = await orderService.getVendorOrders({
          page: currentPage,
          limit: 10,
          status: filterStatus
        });

        setOrders(result.orders);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Failed to load vendor orders:', error);
        showError(error?.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [filterStatus, currentPage, showError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--warning)';
      case 'paid': return 'var(--primary)';
      case 'shipped': return 'var(--info)';
      case 'cancelled': return 'var(--error)';
      case 'delivered': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return <><Clock size={12} /> Pending</>;
      case 'paid': return <><CreditCard size={12} /> Paid</>;
      case 'shipped': return <><Package size={12} /> Shipped</>;
      case 'cancelled': return <><X size={12} /> Cancelled</>;
      case 'delivered': return <><Check size={12} /> Delivered</>;
      default: return status ? status.toUpperCase() : 'Unknown';
    }
  };

  const formatDateTime = (value) => {
    if (!value) return { date: '-', time: '-' };
    const date = new Date(value);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatMoney = (value) => formatCurrency(convert(value, 'INR'), currency, true);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setSavingStatus(true);
      const updatedOrder = await orderService.updateOrderStatus(orderId, newStatus.toUpperCase());

      const normalizedStatus = updatedOrder.status.toLowerCase();
      setOrders((prev) => prev.map((order) => (
        order.id === orderId ? { ...order, status: normalizedStatus } : order
      )));

      setSelectedOrder((prev) => (
        prev && prev.id === orderId
          ? { ...prev, status: normalizedStatus }
          : prev
      ));

      showSuccess('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
      showError(error?.response?.data?.message || 'Failed to update order status');
    } finally {
      setSavingStatus(false);
    }
  };

  const visibleOrders = useMemo(() => orders, [orders]);

  return (
    <div className={styles.container}>
      <VendorPageShell
        title="Orders"
        subtitle="Manage and track all customer orders"
      >

      <div className={styles.filterBar}>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className={filterStatus === status ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All' : getStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        {loading ? (
          <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading orders...</div>
        ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Order ID</th>
              <th className={styles.tableHeader}>Customer</th>
              <th className={styles.tableHeader}>Amount</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Created</th>
              <th className={styles.tableHeader}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.length === 0 ? (
              <tr>
                <td className={styles.tableCell} colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No orders found for this filter.
                </td>
              </tr>
            ) : visibleOrders.map((order) => {
              const { date, time } = formatDateTime(order.createdAt);
              return (
                <tr key={order.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <strong>{order.id}</strong>
                  </td>
                  <td className={styles.tableCell}>{order.customer}</td>
                  <td className={styles.tableCell}>
                    <strong>{formatMoney(Math.round(order.amountCents / 100))}</strong>
                  </td>
                  <td className={styles.tableCell}>
                    <div
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: getStatusColor(order.status)
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </div>
                  </td>
                  <td className={styles.tableCell}>{date} {time}</td>
                  <td className={styles.tableCell}>
                    <button
                      className={styles.viewButton}
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          className={styles.filterButton}
          disabled={loading || currentPage <= 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          Previous
        </button>
        <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>
          Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
        </span>
        <button
          className={styles.filterButton}
          disabled={loading || currentPage >= pagination.totalPages}
          onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
        >
          Next
        </button>
      </div>

      <div className={selectedOrder ? `${styles.modalOverlay} ${styles.modalActive}` : styles.modalOverlay}>
        {selectedOrder && (
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>Order Details</div>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedOrder(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalField}>
                <div className={styles.label}>Order ID</div>
                <div className={styles.value}>{selectedOrder.id}</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.label}>Customer</div>
                <div className={styles.value}>{selectedOrder.customer}</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.label}>Amount</div>
                <div className={styles.value} style={{ color: 'var(--primary)' }}>{formatMoney(Math.round(selectedOrder.amountCents / 100))}</div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.label}>Status</div>
                <div
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: getStatusColor(selectedOrder.status)
                  }}
                >
                  {getStatusLabel(selectedOrder.status)}
                </div>
              </div>
              <div className={styles.modalField}>
                <div className={styles.label}>Payment</div>
                <div className={styles.statusBadge} style={{
                  backgroundColor: selectedOrder.paymentStatus === 'succeeded' ? 'var(--success)' : 'var(--warning)'
                }}>
                  {selectedOrder.paymentStatus === 'succeeded' ? <><Check size={12} /> Paid</> : selectedOrder.paymentStatus.toUpperCase()}
                </div>
              </div>
            </div>

            <div className={styles.modalFieldFull}>
              <div className={styles.label}>Items</div>
              <div className={styles.itemsList}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <span className={styles.itemName}>{item.name} x {item.quantity}</span>
                    <span className={styles.itemPrice}>{formatMoney(Math.round((item.unitPriceCents * item.quantity) / 100))}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
              <div className={styles.modalFieldFull}>
                <div className={styles.label}>Update Status</div>
                <select
                  className={styles.statusDropdown}
                  defaultValue={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  disabled={savingStatus}
                >
                  {selectedOrder.status === 'pending' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="paid">Mark as Paid</option>
                      <option value="shipped">Mark as Shipped</option>
                      <option value="cancelled">Cancel Order</option>
                    </>
                  )}
                  {selectedOrder.status === 'paid' && (
                    <>
                      <option value="paid">Paid</option>
                      <option value="shipped">Mark as Shipped</option>
                      <option value="cancelled">Cancel Order</option>
                    </>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Mark as Delivered</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={`${styles.button} ${styles.secondaryButton}`}>
                Print Invoice
              </button>
              <button className={`${styles.button} ${styles.secondaryButton}`}>
                Send Message
              </button>
            </div>
          </div>
        )}
      </div>
      </VendorPageShell>
    </div>
  );
}

export default VendorOrders;
