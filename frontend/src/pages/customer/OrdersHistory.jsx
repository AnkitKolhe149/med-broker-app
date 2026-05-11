import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlaskConical, Clock, AlertTriangle } from 'lucide-react';
import CustomerAccountPageLayout from '../../components/common/CustomerAccountPageLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { formatConvertedCurrency } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';
import orderService from '../../services/order.service';
import styles from './OrdersHistory.module.css';


const ORDER_STAGES = ['Confirmed', 'Preparing', 'Picked up', 'Delivered'];

/* ── Countdown Timer Hook ── */
function useCountdown(expiresAtISO) {
	const [remainingMs, setRemainingMs] = useState(() => {
		if (!expiresAtISO) return 0;
		return Math.max(0, new Date(expiresAtISO).getTime() - Date.now());
	});

	useEffect(() => {
		if (!expiresAtISO) return;
		const tick = () => {
			const ms = Math.max(0, new Date(expiresAtISO).getTime() - Date.now());
			setRemainingMs(ms);
			if (ms <= 0) clearInterval(intervalId);
		};
		tick();
		const intervalId = setInterval(tick, 1000);
		return () => clearInterval(intervalId);
	}, [expiresAtISO]);

	const minutes = Math.floor(remainingMs / 60000);
	const seconds = Math.floor((remainingMs % 60000) / 1000);
	const isExpired = remainingMs <= 0;

	return { remainingMs, minutes, seconds, isExpired, formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` };
}

/* ── Refund Timer Badge ── */
function RefundTimerBadge({ expiresAt }) {
	const { formatted, isExpired } = useCountdown(expiresAt);
	if (!expiresAt) return null;

	return (
		<span className={`${styles.refundTimerBadge} ${isExpired ? styles.refundTimerExpired : styles.refundTimerOpen}`}>
			<span className={styles.refundTimerIcon}>
				{isExpired ? <AlertTriangle size={13} /> : <Clock size={13} />}
			</span>
			{isExpired ? 'Refund window closed' : `Refund window: ${formatted}`}
		</span>
	);
}

/* ── Refund Breakdown Modal ── */
function RefundBreakdownModal({ eligibility, onClose, onConfirm, confirming, formatPrice }) {
	const [reason, setReason] = useState('');
	if (!eligibility || !eligibility.refund) return null;

	const bd = eligibility.refund.breakdown;
	const fmt = (cents) => formatPrice ? formatPrice(Number(cents || 0) / 100) : (Number(cents || 0) / 100).toFixed(2);

	return (
		<div className={styles.refundModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			<div className={styles.refundModalCard}>
				<div className={styles.refundModalHeader}>
					<h3 className={styles.refundModalTitle}>Cancel Order & Refund</h3>
					<button className={styles.refundModalClose} onClick={onClose}>&#x2715;</button>
				</div>

				<p style={{ margin: '0 0 0.8rem', fontSize: '0.88rem', color: '#475569' }}>
					Only the <strong>medicine cost</strong> is refundable. Shipping, taxes, and fees are non-refundable.
				</p>

				<table className={styles.refundBreakdownTable}>
					<tbody>
						<tr>
							<td>Medicine Subtotal</td>
							<td className={styles.refundBreakdownRefundable}>{fmt(bd.medicineSubtotalCents)}</td>
						</tr>
						{bd.discountCents > 0 && (
							<tr>
								<td>Discount Applied</td>
								<td>- {fmt(bd.discountCents)}</td>
							</tr>
						)}
						<tr>
							<td className={styles.refundBreakdownNonRefundable}>Shipping (non-refundable)</td>
							<td className={styles.refundBreakdownNonRefundable}>{fmt(bd.shippingCents)}</td>
						</tr>
						<tr>
							<td className={styles.refundBreakdownNonRefundable}>Tax (non-refundable)</td>
							<td className={styles.refundBreakdownNonRefundable}>{fmt(bd.nonRefundableTaxCents)}</td>
						</tr>
						<tr className={styles.refundBreakdownTotal}>
							<td style={{ color: '#15803d' }}>Your Refund Amount</td>
							<td style={{ color: '#15803d' }}>{fmt(eligibility.refund.refundableCents)}</td>
						</tr>
					</tbody>
				</table>

				<textarea
					className={styles.refundReasonInput}
					placeholder="Reason for cancellation (optional)"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>

				<div className={styles.refundModalActions}>
					<button className={styles.refundModalCancelBtn} onClick={onClose} disabled={confirming}>Keep Order</button>
					<button
						className={styles.refundModalConfirmBtn}
						onClick={() => onConfirm(reason)}
						disabled={confirming}
					>
						{confirming ? 'Processing...' : 'Cancel & Refund'}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ── Refund Section per Order Card ── */
function OrderRefundSection({ orderId, formatPrice, onRefundComplete }) {
	const [eligibility, setEligibility] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const { showSuccess, showError } = useNotification();

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			try {
				const data = await orderService.getRefundEligibility(orderId);
				if (!cancelled) setEligibility(data);
			} catch (err) {
				console.warn('Failed to load refund eligibility:', err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		load();
		return () => { cancelled = true; };
	}, [orderId]);

	const handleConfirmRefund = async (reason) => {
		try {
			setConfirming(true);
			await orderService.cancelCustomerOrder(orderId);
			showSuccess('Order cancelled. Your medicine cost refund has been initiated.');
			setShowModal(false);
			if (onRefundComplete) onRefundComplete(orderId);
		} catch (err) {
			showError(err?.response?.data?.message || err?.message || 'Failed to process refund');
		} finally {
			setConfirming(false);
		}
	};

	if (loading || !eligibility) return null;

	return (
		<>
			<div className={styles.refundSection}>
				<div className={styles.refundInfoRow}>
					<div>
						<RefundTimerBadge expiresAt={eligibility.windowExpiresAt} />
						{eligibility.eligible && eligibility.refund && (
							<span className={styles.refundEligibleText} style={{ marginLeft: '0.5rem' }}>
								Refundable: <strong>{formatPrice ? formatPrice(eligibility.refund.refundableCents / 100) : (eligibility.refund.refundableCents / 100).toFixed(2)}</strong>
							</span>
						)}
						{!eligibility.eligible && !eligibility.isWindowOpen && (
							<span className={styles.refundExpiredText} style={{ marginLeft: '0.5rem' }}>
								{eligibility.reason}
							</span>
						)}
					</div>
					{eligibility.eligible && (
						<button
							className={styles.refundRequestBtn}
							onClick={() => setShowModal(true)}
						>
							Cancel & Refund
						</button>
					)}
				</div>
			</div>

			{showModal && (
				<RefundBreakdownModal
					eligibility={eligibility}
					onClose={() => setShowModal(false)}
					onConfirm={handleConfirmRefund}
					confirming={confirming}
					formatPrice={formatPrice}
				/>
			)}
		</>
	);
}


function OrdersHistory() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useUser();
	const { currency, exchangeRates } = useCurrency();
	const { showError, showSuccess } = useNotification();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState(() => {
		const queryTab = new URLSearchParams(window.location.search).get('tab');
		return ['upcoming', 'previous', 'scheduled'].includes(queryTab) ? queryTab : 'upcoming';
	});
	const [cancellingOrderId, setCancellingOrderId] = useState(null);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [modalLoading, setModalLoading] = useState(false);
	const [receiptDownloading, setReceiptDownloading] = useState(false);

	const handleDownloadReceipt = async (orderId) => {
		try {
			setReceiptDownloading(true);
			const blob = await orderService.downloadOrderReceipt(orderId);
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `receipt_${orderId}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
			showSuccess('Receipt downloaded');
		} catch (err) {
			console.error('Failed to download receipt:', err);
			showError(err?.response?.data?.message || 'Unable to download receipt right now. Please try again.');
		} finally {
			setReceiptDownloading(false);
		}
	};
	const ordersListRef = useRef(null);
	const defaultCurrencyCode = currency || user?.preferredCurrency || 'INR';
	const formatPrice = (value, targetCurrency = defaultCurrencyCode) => formatConvertedCurrency(value, 'INR', targetCurrency, exchangeRates, true);

	const toUiStatus = (status = '') => {
		const normalized = status.toUpperCase();
		if (normalized === 'SHIPPED') return 'in_transit';
		if (normalized === 'PAID') return 'processing';
		if (normalized === 'PENDING') return 'confirmed';
		if (normalized === 'CANCELLED') return 'cancelled';
		return 'delivered';
	};

	const toEtaText = (uiStatus) => {
		if (uiStatus === 'confirmed') return 'Order confirmed';
		if (uiStatus === 'processing') return 'Preparing for dispatch';
		if (uiStatus === 'in_transit') return 'On the way';
		if (uiStatus === 'cancelled') return 'Order cancelled';
		return 'Delivered';
	};

	useEffect(() => {
		const loadOrders = async () => {
			try {
				setLoading(true);
				const result = await orderService.getCustomerOrders({ page: 1, limit: 50 });
				const mappedOrders = (result.orders || []).map((order) => {
					const uiStatus = toUiStatus(order.status);
					const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
					const sourceCurrencyCode = order.currencyCode || defaultCurrencyCode;
					const sourceTotal = Number(((order.totalCents || 0) / 100).toFixed(2));
					return {
						orderId: order.id,
						status: uiStatus,
						rawStatus: order.status,
						currencyCode: sourceCurrencyCode,
						total: sourceTotal,
						createdAt: order.createdAt,
						placedAt: order.placedAt,
						items: (order.items || []).map((item) => ({
							name: item.medicine?.name || 'Medicine',
							quantity: item.quantity,
							price: Number(((item.unitPriceCents || 0) / 100).toFixed(2))
						})),
						paymentMethod: order.payment?.provider || 'Pending payment',
						paymentStatus: order.payment?.status,
						orderedAgo: createdAt.toLocaleDateString(),
						etaText: toEtaText(uiStatus)
					};
				});
				setOrders(mappedOrders);
			} catch (error) {
				console.error('Failed to load orders:', error);
				showError(error?.response?.data?.message || 'Failed to load orders');
			} finally {
				setLoading(false);
			}
		};

		loadOrders();
	}, []);

	const handleCancelOrder = async (orderId) => {
		try {
			setCancellingOrderId(orderId);
			await orderService.cancelCustomerOrder(orderId);
			setOrders((prev) => prev.map((order) => (
				order.orderId === orderId
					? { ...order, status: 'cancelled', rawStatus: 'CANCELLED', etaText: 'Order cancelled' }
					: order
			)));
			showSuccess('Order cancelled successfully');
		} catch (error) {
			console.error('Failed to cancel order:', error);
			showError(error?.response?.data?.message || 'Failed to cancel order');
		} finally {
			setCancellingOrderId(null);
		}
	};

	const handleRefundComplete = useCallback((orderId) => {
		setOrders((prev) => prev.map((order) => (
			order.orderId === orderId
				? { ...order, status: 'cancelled', rawStatus: 'CANCELLED', etaText: 'Order cancelled — refund initiated' }
				: order
		)));
	}, []);

	const orderBuckets = useMemo(() => {
		const upcoming = orders.filter((order) => ['confirmed', 'in_transit', 'processing'].includes(order.status));
		const previous = orders.filter((order) => ['delivered', 'cancelled'].includes(order.status));
		const scheduled = orders.filter((order) => order.status === 'scheduled');
		return { upcoming, previous, scheduled };
	}, [orders]);

	useEffect(() => {
		if (ordersListRef.current) {
			ordersListRef.current.scrollTop = 0;
		}
	}, [activeTab]);

	useEffect(() => {
		const queryTab = new URLSearchParams(location.search).get('tab');
		if (['upcoming', 'previous', 'scheduled'].includes(queryTab)) {
			setActiveTab(queryTab);
		}
	}, [location.search]);

	const getStageIndex = (status) => {
		switch (status) {
			case 'confirmed': return 0;
			case 'processing': return 1;
			case 'in_transit': return 2;
			case 'delivered': return 3;
			default: return -1;
		}
	};

	const groupOrderItemsByMedicine = (items = []) => {
		const grouped = new Map();
		items.forEach((item) => {
			const medicineName = item?.name;
			if (!medicineName) return;
			const quantity = Math.max(1, Number(item?.quantity) || 1);
			grouped.set(medicineName, (grouped.get(medicineName) || 0) + quantity);
		});
		return Array.from(grouped.entries());
	};

	const getOrderSummary = (items = []) => {
		const groupedItems = groupOrderItemsByMedicine(items);
		if (groupedItems.length === 0) return 'Medicine order';
		if (groupedItems.length === 1) {
			const [name, qty] = groupedItems[0];
			return `${name} x${qty}`;
		}
		if (groupedItems.length === 2) {
			return `${groupedItems[0][0]} x${groupedItems[0][1]}, ${groupedItems[1][0]} x${groupedItems[1][1]}`;
		}
		return `${groupedItems[0][0]} x${groupedItems[0][1]} + ${groupedItems.length - 1} more`;
	};

	const visibleOrders = useMemo(() => {
		if (activeTab === 'previous') return orderBuckets.previous;
		if (activeTab === 'scheduled') return orderBuckets.scheduled;
		return orderBuckets.upcoming;
	}, [activeTab, orderBuckets]);

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading orders...</p>
			</div>
		);
	}

	const tabs = [
		{ key: 'upcoming', label: `Upcoming Orders (${orderBuckets.upcoming.length})` },
		{ key: 'previous', label: `Previous Orders (${orderBuckets.previous.length})` },
		{ key: 'scheduled', label: `Scheduled Orders (${orderBuckets.scheduled.length})` }
	];

	return (
		<>
		<CustomerAccountPageLayout user={user} activeItem="my-orders" title="My Orders">
			<div className={styles.tabsRow}>
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabButtonActive : ''}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div ref={ordersListRef} className={styles.ordersList}>
				{visibleOrders.length === 0 ? (
					<div className={styles.emptyState}>
						<p className={styles.emptyTitle}>No orders in this tab</p>
						<p className={styles.emptyText}>Switch tabs or place a new order from the catalog.</p>
						<button type="button" className="button" onClick={() => navigate('/customer/catalog')}>
							Browse Medicines
						</button>
					</div>
				) : (
					visibleOrders.map((order) => {
						const stageIndex = getStageIndex(order.status);
						const canCancel = ['confirmed', 'processing'].includes(order.status) && order.paymentStatus !== 'SUCCEEDED';
						const showRefundSection = ['confirmed', 'processing', 'in_transit'].includes(order.status);
						const groupedItems = groupOrderItemsByMedicine(order.items);
						const totalUnits = groupedItems.reduce((sum, [, qty]) => sum + qty, 0);

						return (
							<article key={order.orderId} className={styles.orderCard}>
								<div className={styles.orderCardTop}>
									<div className={styles.orderIdentity}>
										<span className={styles.orderIcon}><FlaskConical size={16} strokeWidth={1.75} /></span>
										<div>
											<p className={styles.orderNo}>{getOrderSummary(order.items)}</p>
											<p className={styles.orderRef}>Order #{String(order.orderId || '').slice(0, 8)}</p>
											<p className={styles.orderPrice}>{formatPrice(order.total)}</p>
										</div>
									</div>
									<div className={styles.orderActions}>
										<button type="button" className={styles.detailsButton} onClick={async () => {
											try {
												setModalLoading(true);
												const detail = await orderService.getCustomerOrderById(order.orderId);
												setSelectedOrder(detail);
											} catch (err) {
												showError(err?.response?.data?.message || 'Failed to load order details');
											} finally {
												setModalLoading(false);
											}
										}}>Order Details</button>
										{canCancel && (
											<button
												type="button"
												className={styles.cancelButton}
												onClick={() => handleCancelOrder(order.orderId)}
												disabled={cancellingOrderId === order.orderId}
											>
												{cancellingOrderId === order.orderId ? 'Cancelling...' : 'Cancel Order'}
											</button>
										)}
									</div>
								</div>

								<div className={styles.timelineWrap}>
									<div className={styles.stageLabels}>
										{ORDER_STAGES.map((stage) => (<span key={stage}>{stage}</span>))}
									</div>
									<div className={styles.stageLine}>
										{ORDER_STAGES.map((stage, index) => (
											<div key={stage} className={`${styles.stageDot} ${index <= stageIndex ? styles.stageDotActive : ''}`} />
										))}
										<div className={styles.stageProgress} style={{ width: `${stageIndex <= 0 ? 0 : (stageIndex / (ORDER_STAGES.length - 1)) * 100}%` }} />
									</div>
								</div>

								{/* Refund Pipeline Section */}
								{showRefundSection && (
									<OrderRefundSection
										orderId={order.orderId}
										formatPrice={formatPrice}
										onRefundComplete={handleRefundComplete}
									/>
								)}

								<p className={styles.orderMeta}>
									{groupedItems.length} medicine{groupedItems.length > 1 ? 's' : ''}
									<span>&bull;</span>
									{totalUnits} unit{totalUnits > 1 ? 's' : ''}
									<span>&bull;</span>
									{order.paymentMethod}
									<span>&bull;</span>
									Ordered {order.orderedAgo}
									<span>&bull;</span>
									{order.etaText}
								</p>
							</article>
						);
					})
				)}
			</div>
		</CustomerAccountPageLayout>
		{selectedOrder && (
			<OrderDetailsModal
				order={selectedOrder}
				onClose={() => setSelectedOrder(null)}
				onDownload={handleDownloadReceipt}
				downloading={receiptDownloading}
				formatPrice={formatPrice}
			/>
		)}
		</>
	);
}

// Order Details Modal
const OrderDetailsModal = ({ order, onClose, onDownload, downloading, formatPrice }) => {
	if (!order) return null;
	return (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
			<div style={{ width: '90%', maxWidth: 820, background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
					<h3 style={{ margin: 0 }}>Order Details</h3>
					<div>
						<button style={{ marginRight: 8 }} onClick={onClose}>Close</button>
						<button onClick={() => onDownload(order.id)} disabled={downloading} style={{ background: '#218e66', color: 'white', border: 0, padding: '8px 12px', borderRadius: 6 }}>
							{downloading ? 'Downloading...' : 'Download Receipt'}
						</button>
					</div>
				</div>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
					<div>
						<div style={{ fontWeight: 700 }}>Order ID</div>
						<div style={{ marginBottom: 8 }}>{order.id}</div>
						<div style={{ fontWeight: 700 }}>Customer</div>
						<div style={{ marginBottom: 8 }}>{order.user?.name || order.user?.email}</div>
						<div style={{ fontWeight: 700 }}>Status</div>
						<div style={{ marginBottom: 8 }}>{order.status}</div>
					</div>
					<div>
						<div style={{ fontWeight: 700 }}>Totals</div>
						{(() => {
							const pricing = (order.checkoutSnapshot && order.checkoutSnapshot.pricingSummary) || {};
							const subtotalCents = typeof pricing.subtotalCents === 'number' ? pricing.subtotalCents
								: (typeof order.subtotalCents === 'number' && order.subtotalCents > 0) ? order.subtotalCents
								: (order.items || []).reduce((s, it) => s + ((it.unitPriceCents || 0) * (it.quantity || 1)), 0);
							const taxCents = typeof pricing.taxCents === 'number' ? pricing.taxCents : (typeof order.taxCents === 'number' ? order.taxCents : 0);
							const shippingCents = typeof pricing.deliveryChargeCents === 'number' ? pricing.deliveryChargeCents : (typeof order.shippingCents === 'number' ? order.shippingCents : 0);
							const totalCents = typeof pricing.totalCents === 'number' ? pricing.totalCents
								: (typeof order.totalCents === 'number' && order.totalCents > 0) ? order.totalCents : subtotalCents + taxCents + shippingCents;
							const fmt = (cents) => formatPrice ? formatPrice(Number(cents || 0) / 100) : (Number(cents || 0) / 100).toFixed(2);
							return (
								<>
									<div style={{ marginBottom: 8 }}>Subtotal: {fmt(subtotalCents)}</div>
									<div style={{ marginBottom: 8 }}>Shipping: {fmt(shippingCents)}</div>
									<div style={{ marginBottom: 8 }}>Tax: {fmt(taxCents)}</div>
									<div style={{ marginBottom: 8, fontWeight: 700 }}>Total: {fmt(totalCents)}</div>
								</>
							);
						})()}
					</div>
				</div>
				<div style={{ marginTop: 16 }}>
					<h4>Items</h4>
					<table style={{ width: '100%', borderCollapse: 'collapse' }}>
						<thead>
							<tr>
								<th style={{ textAlign: 'left', padding: 8 }}>Name</th>
								<th style={{ textAlign: 'right', padding: 8 }}>Unit Price</th>
								<th style={{ textAlign: 'right', padding: 8 }}>Qty</th>
								<th style={{ textAlign: 'right', padding: 8 }}>Total</th>
							</tr>
						</thead>
						<tbody>
							{(order.items || []).map((it) => (
								<tr key={it.id}>
									<td style={{ padding: 8 }}>{it.medicine?.name || it.medicineId}</td>
									<td style={{ padding: 8, textAlign: 'right' }}>{formatPrice ? formatPrice((it.unitPriceCents || 0) / 100) : ((it.unitPriceCents || 0) / 100).toFixed(2)}</td>
									<td style={{ padding: 8, textAlign: 'right' }}>{it.quantity}</td>
									<td style={{ padding: 8, textAlign: 'right' }}>{formatPrice ? formatPrice(((it.unitPriceCents || 0) * (it.quantity || 1)) / 100) : (((it.unitPriceCents || 0) * (it.quantity || 1)) / 100).toFixed(2)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default OrdersHistory;
