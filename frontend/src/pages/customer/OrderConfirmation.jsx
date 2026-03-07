import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import styles from './OrderConfirmation.module.css';

function OrderConfirmation() {
	const { orderId } = useParams();
	const navigate = useNavigate();
	const { user } = useUser();
	const [orderData, setOrderData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);

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

	const handleDownloadInvoice = () => {
		// In a real application, this would generate a PDF invoice
		const invoiceContent = `
========================================
				MedBroker Invoice
========================================

Order ID: ${orderData.orderId}
Order Date: ${new Date(orderData.completedAt).toLocaleDateString()}
Order Time: ${new Date(orderData.completedAt).toLocaleTimeString()}

CUSTOMER DETAILS
==================
Name: ${orderData.deliveryAddress.fullName}
Phone: ${orderData.deliveryAddress.phone}
Email: ${orderData.deliveryAddress.email}

DELIVERY ADDRESS
==================
${orderData.deliveryAddress.address}
${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.state} ${orderData.deliveryAddress.zipCode}
${orderData.deliveryAddress.country}

ITEMS ORDERED
==================
${orderData.cartItems.map(item => `
${item.name}
Quantity: ${item.quantity} × ₹${item.basePrice.toFixed(2)} = ₹${(item.basePrice * item.quantity).toFixed(2)}
Category: ${item.category}
Vendor: ${item.vendor}
`).join('\n')}

PRICE SUMMARY
==================
Subtotal: ₹${orderData.subtotal.toFixed(2)}
${orderData.discountPercent > 0 ? `Discount (${orderData.discountPercent}%): -₹${(orderData.subtotal * orderData.discountPercent / 100).toFixed(2)}` : ''}
Delivery Charge: ${orderData.subtotal > 500 ? 'Free' : '₹50'}
Tax (5% GST): ₹${calculateTax().toFixed(2)}
---
Total Amount: ₹${orderData.total.toFixed(2)}

PAYMENT METHOD
==================
${orderData.paymentMethod.toUpperCase()}
Status: COMPLETED

DELIVERY TYPE
==================
${orderData.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Store Pickup'}

SPECIAL INSTRUCTIONS
==================
${orderData.orderNotes || 'None'}

========================================
Thank you for your order!
Track your delivery at www.medbroker.com/track/${orderData.orderId}
========================================
		`;

		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(invoiceContent));
		element.setAttribute('download', `invoice_${orderData.orderId}.txt`);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);

		setInvoiceDownloaded(true);
	};

	const calculateTax = () => {
		const subtotal = orderData.subtotal;
		const discount = (subtotal * orderData.discountPercent) / 100;
		const deliveryCharge = subtotal > 500 ? 0 : 50;
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
											<p className={styles.amount}>₹{(item.basePrice * item.quantity).toFixed(2)}</p>
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
									<p className={styles.phone}>📱 {orderData.deliveryAddress.phone}</p>
									<p className={styles.email}>📧 {orderData.deliveryAddress.email}</p>
								</div>

								{orderData.deliveryType === 'home_delivery' && (
									<div className={styles.infoBox}>
										<p className={styles.infoText}>
											📍 <strong>Estimated Delivery:</strong> Within 2-3 business days
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
									📥 Download Invoice
								</button>
								<button 
									onClick={() => navigate('/customer/orders')}
									className={styles.button}
									style={{ backgroundColor: 'var(--secondary)' }}
								>
									📦 Track Orders
								</button>
								<button 
									onClick={() => navigate('/customer/catalog')}
									className={styles.button}
									style={{ backgroundColor: 'var(--text-secondary)' }}
								>
									🛒 Continue Shopping
								</button>
							</div>

							{invoiceDownloaded && (
								<div className={styles.successMessage}>
									✓ Invoice downloaded successfully
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
										<span>₹{orderData.subtotal.toFixed(2)}</span>
									</div>
									{orderData.discountPercent > 0 && (
										<div className={styles.summaryRow} style={{ color: 'var(--success)' }}>
											<span>Discount ({orderData.discountPercent}%)</span>
											<span>−₹{(orderData.subtotal * orderData.discountPercent / 100).toFixed(2)}</span>
										</div>
									)}
									<div className={styles.summaryRow}>
										<span>Delivery Charge</span>
										<span>{orderData.subtotal > 500 ? 'Free' : '₹50'}</span>
									</div>
									<div className={styles.summaryRow}>
										<span>Tax (5% GST)</span>
										<span>₹{calculateTax().toFixed(2)}</span>
									</div>
									<div className={styles.summaryTotal}>
										<span>Total Paid</span>
										<span>₹{orderData.total.toFixed(2)}</span>
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
									<p className={styles.trackingLabel}>📍 Track Your Order</p>
									<a href={`#/customer/orders`} className={styles.trackingLink}>
										View tracking details →
									</a>
								</div>

								<div className={styles.supportBox}>
									<p className={styles.supportTitle}>Need Help?</p>
									<a href="mailto:support@medbroker.com" className={styles.supportLink}>
										📧 support@medbroker.com
									</a>
									<p className={styles.supportPhone}>📱 +91-1234-567-890</p>
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
