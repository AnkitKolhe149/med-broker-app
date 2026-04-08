import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Mail, MapPin, Package, Phone, ShoppingCart } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './OrderConfirmation.module.css';

function OrderConfirmation() {
	const { orderId } = useParams();
	const navigate = useNavigate();
	const { user } = useUser();
	const { currency, convert } = useCurrency();
	const [orderData, setOrderData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);
	const [invoiceError, setInvoiceError] = useState('');
	const currencyCode = orderData?.currencyCode || currency || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);
	const toDisplayAmount = (value) => convert(value, 'INR');

	useEffect(() => {
		const completedOrder = sessionStorage.getItem('completed_order');
		if (completedOrder) {
			try {
				setOrderData(JSON.parse(completedOrder));
			} catch (error) {
				console.error('Failed to parse order data:', error);
				navigate('/customer/dashboard');
			}
		} else {
			navigate('/customer/dashboard');
		}
		setLoading(false);
	}, [navigate]);

	const handleDownloadInvoice = async () => {
		try {
			setInvoiceError('');
			const blob = await orderService.downloadOrderReceipt(orderData.orderId);
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = `receipt_${orderData.orderId}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(downloadUrl);

			setInvoiceDownloaded(true);
		} catch (error) {
			console.error('Failed to download receipt:', error);
			setInvoiceError('Unable to download receipt right now. Please try again.');
		}
	};

	const calculateTax = () => {
		const subtotal = orderData.subtotalBase !== undefined && orderData.subtotalBase !== null
			? toDisplayAmount(orderData.subtotalBase)
			: orderData.subtotal;
		const discount = (subtotal * orderData.discountPercent) / 100;
		const deliveryCharge = orderData.deliveryType === 'express' ? 9 : 0;
		return (subtotal - discount + deliveryCharge) * 0.05;
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading order confirmation...</p>
			</div>
		);
	}

	if (!orderData) {
		return (
			<main className="page">
				<div className="container">
					<div className={styles.emptyState}>
						<p>Order not found.</p>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div className={styles.successContainer}>
					<div className={styles.successIcon}>✓</div>
					<h1 className={styles.successTitle}>Order Confirmed!</h1>
					<p className={styles.successSubtitle}>Your order has been placed successfully</p>

					{/* User Info Section */}
					<section className="section" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', justifyContent: 'center' }}>
						<Avatar 
							src={user?.customer?.profileImage}
							name={user?.customer?.fullName}
							size={50}
						/>
						<div style={{ textAlign: 'left' }}>
							<p style={{ fontWeight: 500 }}>{user?.customer?.fullName || user?.email}</p>
							<p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
						</div>
					</section>

					{/* Order ID Card */}
					<section className="section" style={{ marginBottom: '2rem', textAlign: 'center' }}>
						<p className={styles.orderIdLabel}>Order ID</p>
						<p className={styles.orderIdValue}>{orderData.orderId}</p>
						<p className={styles.orderIdHint}>
							Save this ID for tracking and customer service inquiries
						</p>
					</section>

					{/* Main Content Grid */}
					<div className={styles.mainContent}>
						{/* Left: Order Details */}
						<div className={styles.detailsSection}>
							{/* Items */}
						<section className="section">
								<h2 className={styles.cardTitle}>Items Ordered</h2>
								{orderData.cartItems.map((item, index) => (
									<div key={index} className={styles.itemDetail}>
										<div className={styles.itemMeta}>
											<p className={styles.itemName}>{item.name}</p>
											<p className={styles.itemVendor}>Vendor: {item.vendor}</p>
										</div>
										<div className={styles.itemAmount}>
											<p className={styles.qty}>Qty: {item.quantity}</p>
											<p className={styles.amount}>{formatPrice(item.basePrice * item.quantity)}</p>
										</div>
									</div>
								))}
							</section>

							{/* Delivery Addresss */}
							<section className="section">
								<h2 className={styles.cardTitle}>Delivery Address</h2>
								<div className={styles.addressBox}>
									<p className={styles.name}>{orderData.deliveryAddress.fullName}</p>
									<p className={styles.address}>{orderData.deliveryAddress.address}</p>
									<p className={styles.address}>{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}</p>
									<p className={styles.address}>{orderData.deliveryAddress.country}</p>
									<p className={styles.phone}><Phone size={14} strokeWidth={1.75} /> {orderData.deliveryAddress.phone}</p>
									<p className={styles.email}><Mail size={14} strokeWidth={1.75} /> {orderData.deliveryAddress.email}</p>
								</div>

								{orderData.deliveryType === 'home_delivery' && (
									<div className={styles.infoBox}>
										<p className={styles.infoText}>
											<MapPin size={14} strokeWidth={1.75} /> <strong>Estimated Delivery:</strong> Within 2-3 business days
										</p>
									</div>
								)}
							</section>

							{/* Special Instructions */}
							{orderData.orderNotes && (
								<section className="section">
									<h2 className={styles.cardTitle}>Special Instructions</h2>
									<p className={styles.notes}>{orderData.orderNotes}</p>
								</section>
							)}

							{/* Actions */}
							<div className={styles.actionButtons}>
								<button 
									onClick={handleDownloadInvoice}
									className={styles.button}
									style={{ backgroundColor: 'var(--primary)' }}
								>
									<Download size={14} strokeWidth={1.75} /> Download Invoice
								</button>
								<button 
									onClick={() => navigate('/customer/orders')}
									className={styles.button}
									style={{ backgroundColor: 'var(--secondary)' }}
								>
									<Package size={14} strokeWidth={1.75} /> Track Orders
								</button>
								<button 
									onClick={() => navigate('/customer/catalog')}
									className={styles.button}
									style={{ backgroundColor: 'var(--text-secondary)' }}
								>
									<ShoppingCart size={14} strokeWidth={1.75} /> Continue Shopping
								</button>
							</div>

							{invoiceDownloaded && (
								<div className={styles.successMessage}>
									✓ Invoice downloaded successfully
								</div>
							)}

							{invoiceError && (
								<div className={styles.emptyState}>
									{invoiceError}
								</div>
							)}
						</div>

						{/* Right: Summary */}
						<div className={styles.summarySection}>
							<div className={styles.summaryCard}>
								<h2 className={styles.summaryTitle}>Order Summary</h2>

								<div className={styles.summaryContent}>
									<div className={styles.summaryRow}>
										<span>Subtotal</span>
										<span>{formatPrice(orderData.subtotalBase !== undefined && orderData.subtotalBase !== null ? toDisplayAmount(orderData.subtotalBase) : orderData.subtotal)}</span>
									</div>
									{orderData.discountPercent > 0 && (
										<div className={styles.summaryRow} style={{ color: 'var(--success)' }}>
											<span>Discount ({orderData.discountPercent}%)</span>
											<span>−{formatPrice((orderData.subtotalBase !== undefined && orderData.subtotalBase !== null ? toDisplayAmount(orderData.subtotalBase) : orderData.subtotal) * orderData.discountPercent / 100)}</span>
										</div>
									)}
									<div className={styles.summaryRow}>
										<span>Delivery Charge</span>
										<span>{(orderData.subtotalBase !== undefined && orderData.subtotalBase !== null ? toDisplayAmount(orderData.subtotalBase) : orderData.subtotal) > 500 ? 'Free' : formatPrice(50)}</span>
									</div>
									<div className={styles.summaryRow}>
										<span>Tax (5% GST)</span>
										<span>{formatPrice(calculateTax())}</span>
									</div>
									<div className={styles.summaryTotal}>
										<span>Total Paid</span>
										<span>{formatPrice(orderData.totalBase !== undefined && orderData.totalBase !== null ? toDisplayAmount(orderData.totalBase) : orderData.total)}</span>
									</div>
								</div>

								<hr className={styles.divider} />

								<div className={styles.paymentInfo}>
									<p className={styles.infoLabel}>Payment Method</p>
									<p className={styles.infoValue}>{orderData.paymentMethod.toUpperCase()}</p>
									<p className={styles.infoLabel} style={{ marginTop: '1rem' }}>Status</p>
									<p className={styles.infoValue} style={{ color: 'var(--success)' }}>✓ CONFIRMED</p>
								</div>

								<div className={styles.trackingCard}>
									<p className={styles.trackingLabel}><MapPin size={14} strokeWidth={1.75} /> Track Your Order</p>
									<button
										type="button"
										onClick={() => navigate('/customer/orders')}
										className={styles.trackingLink}
										style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
									>
										View tracking details →
									</button>
								</div>

								<div className={styles.supportBox}>
									<p className={styles.supportTitle}>Need Help?</p>
									<a href="mailto:support@mediq.com" className={styles.supportLink}>
										<Mail size={14} strokeWidth={1.75} /> support@mediq.com
									</a>
									<p className={styles.supportPhone}><Phone size={14} strokeWidth={1.75} /> +91-1234-567-890</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer Message */}
					<div className={styles.confirmationFooter}>
						<p>
							We've sent a confirmation email to <strong>{orderData.deliveryAddress.email}</strong>
						</p>
						<p className={styles.footerNote}>
							Keep your Order ID ({orderData.orderId}) for reference
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
export default OrderConfirmation;
