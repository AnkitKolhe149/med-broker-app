import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './OrdersHistory.module.css';

const ORDER_STAGES = ['Confirmed', 'Preparing', 'Picked up', 'Delivered'];

function OrdersHistory() {
	const navigate = useNavigate();
	const { user } = useUser();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [activeTab, setActiveTab] = useState('upcoming');
	const ordersListRef = useRef(null);
	const defaultCurrencyCode = localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value, currencyCode = defaultCurrencyCode) => formatCurrency(value, currencyCode, true);

	useEffect(() => {
		const loadOrders = async () => {
			try {
				setLoading(true);
				setError('');
				const result = await orderService.getCustomerOrders({ page: 1, limit: 100 });
				setOrders(result.orders || []);
			} catch (error) {
				console.error('Failed to load orders:', error);
				setError(error.message || 'Failed to load orders');
				setOrders([]);
			} finally {
				setLoading(false);
			}
		};

		loadOrders();
	}, []);

	const orderBuckets = useMemo(() => {
		const upcoming = orders.filter((order) => order.bucket === 'upcoming');
		const previous = orders.filter((order) => order.bucket === 'previous');
		const scheduled = orders.filter((order) => order.bucket === 'scheduled');
		return { upcoming, previous, scheduled };
	}, [orders]);

	const visibleOrders = useMemo(() => {
		if (activeTab === 'previous') return orderBuckets.previous;
		if (activeTab === 'scheduled') return orderBuckets.scheduled;
		return orderBuckets.upcoming;
	}, [activeTab, orderBuckets]);

	useEffect(() => {
		if (ordersListRef.current) {
			ordersListRef.current.scrollTop = 0;
		}
	}, [activeTab]);

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

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading orders...</p>
			</div>
		);
	}

	if (error) {
		return (
			<main className="page">
				<div className={`container ${styles.ordersPage}`}>
					<section className={styles.contentPanel}>
						<div className={styles.emptyState}>
							<p className={styles.emptyTitle}>Unable to load orders</p>
							<p className={styles.emptyText}>{error}</p>
							<button type="button" className="button" onClick={() => navigate('/customer/catalog')}>
								Browse Medicines
							</button>
						</div>
					</section>
				</div>
			</main>
		);
	}

	const menuItems = [
		{ label: 'My Profile', icon: '👤', action: () => navigate('/customer/profile') },
		{ label: 'My List', icon: '📋' },
		{ label: 'My Orders', icon: '✓', isActive: true },
		{ label: 'Payments', icon: '💳', action: () => navigate('/customer/payment'), chip: 'EGP 310' },
		{ label: 'Address Book', icon: '📍' },
		{ label: 'Referrals', icon: '➤' },
		{ label: 'Account Settings', icon: '⚙️' }
	];

	const tabs = [
		{ key: 'upcoming', label: `Upcoming Orders (${orderBuckets.upcoming.length})` },
		{ key: 'previous', label: `Previous Orders (${orderBuckets.previous.length})` },
		{ key: 'scheduled', label: `Scheduled Orders (${orderBuckets.scheduled.length})` }
	];

	return (
		<main className="page">
			<div className={`container ${styles.ordersPage}`}>
				<aside className={styles.sidebar}>
					<div className={styles.profileCard}>
						<Avatar
							src={user?.customer?.profileImage}
							name={user?.customer?.fullName || user?.email || 'Customer'}
							size={44}
						/>
						<div>
							<p className={styles.profileName}>{user?.customer?.fullName || 'Customer'}</p>
							<p className={styles.profilePhone}>{user?.customer?.phone || 'No phone added'}</p>
						</div>
					</div>

					<nav className={styles.sidebarMenu}>
						{menuItems.map((item) => (
							<button
								key={item.label}
								type="button"
								onClick={item.action}
								className={`${styles.menuItem} ${item.isActive ? styles.menuItemActive : ''}`}
							>
								<span className={styles.menuIcon}>{item.icon}</span>
								<span className={styles.menuLabel}>{item.label}</span>
								{item.chip && <span className={styles.menuChip}>{item.chip}</span>}
								<span className={styles.menuArrow}>›</span>
							</button>
						))}
					</nav>
				</aside>

				<section className={styles.contentPanel}>
					<h1 className={styles.pageTitle}>My Orders</h1>

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
								const stageIndex = getStageIndex(order.displayStatus);
								const canCancel = ['confirmed', 'processing', 'in_transit'].includes(order.displayStatus);

								return (
									<article key={order.orderId} className={styles.orderCard}>
										<div className={styles.orderCardTop}>
											<div className={styles.orderIdentity}>
												<span className={styles.orderIcon}>🧪</span>
												<div>
													<p className={styles.orderNo}>Order no #{order.orderId}</p>
													<p className={styles.orderPrice}>{formatPrice((order.totalCents || 0) / 100, order.currencyCode || defaultCurrencyCode)}</p>
												</div>
											</div>

											<div className={styles.orderActions}>
												<button type="button" className={styles.detailsButton}>Order Details</button>
												{canCancel && <button type="button" className={styles.cancelButton}>Cancel Order</button>}
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
											{order.itemsCount} item{order.itemsCount > 1 ? 's' : ''}
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
				</section>
			</div>
		</main>
	);
}

export default OrdersHistory;
