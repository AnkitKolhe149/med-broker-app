import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerAccountPageLayout from '../../components/common/CustomerAccountPageLayout';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { convertPrice, formatCurrency, getCurrencyForCountry } from '../../utils/currency';
import { useNotification } from '../../context/NotificationContext';
import orderService from '../../services/order.service';
import styles from './OrdersHistory.module.css';

const ORDER_STAGES = ['Confirmed', 'Preparing', 'Picked up', 'Delivered'];

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
	const ordersListRef = useRef(null);
	const defaultCurrencyCode = getCurrencyForCountry(user?.customer?.country || user?.vendor?.country, currency || 'USD');
	const formatPrice = (value, currencyCode = defaultCurrencyCode) => formatCurrency(convertPrice(value, 'INR', currencyCode, exchangeRates), currencyCode, true);

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
					return {
						orderId: order.id,
						status: uiStatus,
						currencyCode: defaultCurrencyCode,
						total: Number(((order.totalCents || 0) / 100).toFixed(2)),
						items: (order.items || []).map((item) => ({
							name: item.medicine?.name || 'Medicine',
							quantity: item.quantity,
							price: Number(((item.unitPriceCents || 0) / 100).toFixed(2))
						})),
						paymentMethod: order.payment?.provider || 'Pending payment',
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
					? { ...order, status: 'cancelled', etaText: 'Order cancelled' }
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
			case 'confirmed':
				return 0;
			case 'processing':
				return 1;
			case 'in_transit':
				return 2;
			case 'delivered':
				return 3;
			default:
				return -1;
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
		if (groupedItems.length === 0) {
			return 'Medicine order';
		}

		if (groupedItems.length === 1) {
			const [medicineName, quantity] = groupedItems[0];
			return `${medicineName} x${quantity}`;
		}

		if (groupedItems.length === 2) {
			const [firstMedicineName, firstQuantity] = groupedItems[0];
			const [secondMedicineName, secondQuantity] = groupedItems[1];
			return `${firstMedicineName} x${firstQuantity}, ${secondMedicineName} x${secondQuantity}`;
		}

		const [firstMedicineName, firstQuantity] = groupedItems[0];
		return `${firstMedicineName} x${firstQuantity} + ${groupedItems.length - 1} more`;
	};

	const getItemsSignature = (items = []) => {
		const groupedItems = groupOrderItemsByMedicine(items);
		return groupedItems
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([name, qty]) => `${name}:${qty}`)
			.join('|');
	};

	const groupOrdersForDisplay = (ordersList = []) => {
		const groupedMap = new Map();

		ordersList.forEach((order) => {
			const signature = getItemsSignature(order.items);
			const groupKey = `${order.status}::${order.paymentMethod}::${signature}`;

			if (!groupedMap.has(groupKey)) {
				groupedMap.set(groupKey, {
					orderIds: [],
					status: order.status,
					currencyCode: order.currencyCode,
					total: 0,
					items: [],
					paymentMethod: order.paymentMethod,
					orderedAgo: order.orderedAgo,
					etaText: order.etaText,
					orderCount: 0
				});
			}

			const group = groupedMap.get(groupKey);
			group.orderIds.push(order.orderId);
			group.orderCount += 1;
			group.total += Number(order.total || 0);

			const mergedItemsMap = new Map(group.items.map((item) => [item.name, item.quantity]));
			(order.items || []).forEach((item) => {
				const quantity = Math.max(1, Number(item?.quantity) || 1);
				mergedItemsMap.set(item.name, (mergedItemsMap.get(item.name) || 0) + quantity);
			});
			group.items = Array.from(mergedItemsMap.entries()).map(([name, quantity]) => ({ name, quantity }));
		});

		return Array.from(groupedMap.values());
	};

	const groupedOrderBuckets = useMemo(() => ({
		upcoming: groupOrdersForDisplay(orderBuckets.upcoming),
		previous: groupOrdersForDisplay(orderBuckets.previous),
		scheduled: groupOrdersForDisplay(orderBuckets.scheduled)
	}), [orderBuckets]);

	const visibleOrders = useMemo(() => {
		if (activeTab === 'previous') return groupedOrderBuckets.previous;
		if (activeTab === 'scheduled') return groupedOrderBuckets.scheduled;
		return groupedOrderBuckets.upcoming;
	}, [activeTab, groupedOrderBuckets]);

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading orders...</p>
			</div>
		);
	}

	const tabs = [
		{ key: 'upcoming', label: `Upcoming Orders (${groupedOrderBuckets.upcoming.length})` },
		{ key: 'previous', label: `Previous Orders (${groupedOrderBuckets.previous.length})` },
		{ key: 'scheduled', label: `Scheduled Orders (${groupedOrderBuckets.scheduled.length})` }
	];

	return (
		<CustomerAccountPageLayout
			user={user}
			activeItem="my-orders"
			title="My Orders"
		>

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
								const canCancel = order.orderCount === 1 && ['confirmed', 'processing', 'in_transit'].includes(order.status);
								const groupedItems = groupOrderItemsByMedicine(order.items);
								const totalUnits = groupedItems.reduce((sum, [, quantity]) => sum + quantity, 0);

								return (
									<article key={`${order.status}-${order.paymentMethod}-${order.orderIds?.[0] || 'group'}`} className={styles.orderCard}>
										<div className={styles.orderCardTop}>
											<div className={styles.orderIdentity}>
												<span className={styles.orderIcon}>🧪</span>
												<div>
													<p className={styles.orderNo}>{getOrderSummary(order.items)}</p>
													<p className={styles.orderRef}>Order #{String(order.orderIds?.[0] || '').slice(0, 8)}</p>
													<p className={styles.orderPrice}>{formatPrice(order.total, order.currencyCode)}</p>
												</div>
											</div>

											<div className={styles.orderActions}>
												<button type="button" className={styles.detailsButton}>Order Details</button>
												{canCancel && (
													<button
														type="button"
														className={styles.cancelButton}
														onClick={() => handleCancelOrder(order.orderIds[0])}
														disabled={cancellingOrderId === order.orderIds[0]}
													>
														{cancellingOrderId === order.orderIds[0] ? 'Cancelling...' : 'Cancel Order'}
													</button>
												)}
											</div>
										</div>

										<div className={styles.timelineWrap}>
											<div className={styles.stageLabels}>
												{ORDER_STAGES.map((stage) => (
													<span key={stage}>{stage}</span>
												))}
											</div>
											<div className={styles.stageLine}>
												{ORDER_STAGES.map((stage, index) => (
													<div
														key={stage}
														className={`${styles.stageDot} ${index <= stageIndex ? styles.stageDotActive : ''}`}
													/>
												))}
												<div
													className={styles.stageProgress}
													style={{ width: `${stageIndex <= 0 ? 0 : (stageIndex / (ORDER_STAGES.length - 1)) * 100}%` }}
												/>
											</div>
										</div>

										<p className={styles.orderMeta}>
											{groupedItems.length} medicine{groupedItems.length > 1 ? 's' : ''}
											<span>•</span>
											{totalUnits} unit{totalUnits > 1 ? 's' : ''}
											<span>•</span>
											{order.paymentMethod}
											<span>•</span>
											Ordered {order.orderedAgo}
											<span>•</span>
											{order.etaText}
										</p>
									</article>
								);
							})
						)}
					</div>
		</CustomerAccountPageLayout>
	);
}

export default OrdersHistory;
