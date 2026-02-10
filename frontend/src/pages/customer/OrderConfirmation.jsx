import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function OrderConfirmation() {
	const { orderId } = useParams();
	const navigate = useNavigate();
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
					<div style={styles.emptyState}>
						<p>Order not found.</p>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div style={styles.successContainer}>
					<div style={styles.successIcon}>✓</div>
					<h1 style={styles.successTitle}>Order Confirmed!</h1>
					<p style={styles.successSubtitle}>Your order has been placed successfully</p>

					{/* Order ID Card */}
					<section className="section" style={{ marginBottom: '2rem', textAlign: 'center' }}>
						<p style={styles.orderIdLabel}>Order ID</p>
						<p style={styles.orderIdValue}>{orderData.orderId}</p>
						<p style={styles.orderIdHint}>
							Save this ID for tracking and customer service inquiries
						</p>
					</section>

					{/* Main Content Grid */}
					<div style={styles.mainContent}>
						{/* Left: Order Details */}
						<div style={styles.detailsSection}>
							{/* Items */}
						<section className="section">
								<h2 style={styles.cardTitle}>Items Ordered</h2>
								{orderData.cartItems.map((item, index) => (
									<div key={index} style={styles.itemDetail}>
										<div style={styles.itemMeta}>
											<p style={styles.itemName}>{item.name}</p>
											<p style={styles.itemVendor}>Vendor: {item.vendor}</p>
										</div>
										<div style={styles.itemAmount}>
											<p style={styles.qty}>Qty: {item.quantity}</p>
											<p style={styles.amount}>₹{(item.basePrice * item.quantity).toFixed(2)}</p>
										</div>
									</div>
								))}
							</section>

							{/* Delivery Addresss */}
							<section className="section">
								<h2 style={styles.cardTitle}>Delivery Address</h2>
								<div style={styles.addressBox}>
									<p style={styles.name}>{orderData.deliveryAddress.fullName}</p>
									<p style={styles.address}>{orderData.deliveryAddress.address}</p>
									<p style={styles.address}>{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}</p>
									<p style={styles.address}>{orderData.deliveryAddress.country}</p>
									<p style={styles.phone}>📱 {orderData.deliveryAddress.phone}</p>
									<p style={styles.email}>📧 {orderData.deliveryAddress.email}</p>
								</div>

								{orderData.deliveryType === 'home_delivery' && (
									<div style={styles.infoBox}>
										<p style={styles.infoText}>
											📍 <strong>Estimated Delivery:</strong> Within 2-3 business days
										</p>
									</div>
								)}
							</section>

							{/* Special Instructions */}
							{orderData.orderNotes && (
								<section className="section">
									<h2 style={styles.cardTitle}>Special Instructions</h2>
									<p style={styles.notes}>{orderData.orderNotes}</p>
								</section>
							)}

							{/* Actions */}
							<div style={styles.actionButtons}>
								<button 
									onClick={handleDownloadInvoice}
									style={{...styles.button, backgroundColor: 'var(--primary)'}}
								>
									📥 Download Invoice
								</button>
								<button 
									onClick={() => navigate('/customer/orders')}
									style={{...styles.button, backgroundColor: 'var(--secondary)'}}
								>
									📦 Track Orders
								</button>
								<button 
									onClick={() => navigate('/customer/catalog')}
									style={{...styles.button, backgroundColor: 'var(--text-secondary)'}}
								>
									🛒 Continue Shopping
								</button>
							</div>

							{invoiceDownloaded && (
								<div style={styles.successMessage}>
									✓ Invoice downloaded successfully
								</div>
							)}
						</div>

						{/* Right: Summary */}
						<div style={styles.summarySection}>
							<div style={styles.summaryCard}>
								<h2 style={styles.summaryTitle}>Order Summary</h2>

								<div style={styles.summaryContent}>
									<div style={styles.summaryRow}>
										<span>Subtotal</span>
										<span>₹{orderData.subtotal.toFixed(2)}</span>
									</div>
									{orderData.discountPercent > 0 && (
										<div style={{ ...styles.summaryRow, color: 'var(--success)' }}>
											<span>Discount ({orderData.discountPercent}%)</span>
											<span>−₹{(orderData.subtotal * orderData.discountPercent / 100).toFixed(2)}</span>
										</div>
									)}
									<div style={styles.summaryRow}>
										<span>Delivery Charge</span>
										<span>{orderData.subtotal > 500 ? 'Free' : '₹50'}</span>
									</div>
									<div style={styles.summaryRow}>
										<span>Tax (5% GST)</span>
										<span>₹{calculateTax().toFixed(2)}</span>
									</div>
									<div style={styles.summaryTotal}>
										<span>Total Paid</span>
										<span>₹{orderData.total.toFixed(2)}</span>
									</div>
								</div>

								<hr style={styles.divider} />

								<div style={styles.paymentInfo}>
									<p style={styles.infoLabel}>Payment Method</p>
									<p style={styles.infoValue}>{orderData.paymentMethod.toUpperCase()}</p>
									<p style={{ ...styles.infoLabel, marginTop: '1rem' }}>Status</p>
									<p style={{ ...styles.infoValue, color: 'var(--success)' }}>✓ CONFIRMED</p>
								</div>

								<div style={styles.trackingCard}>
									<p style={styles.trackingLabel}>📍 Track Your Order</p>
									<a href={`#/customer/orders`} style={styles.trackingLink}>
										View tracking details →
									</a>
								</div>

								<div style={styles.supportBox}>
									<p style={styles.supportTitle}>Need Help?</p>
									<a href="mailto:support@medbroker.com" style={styles.supportLink}>
										📧 support@medbroker.com
									</a>
									<p style={styles.supportPhone}>📱 +91-1234-567-890</p>
								</div>
							</div>
						</div>
					</div>

					{/* Footer Message */}
					<div style={styles.confirmationFooter}>
						<p>
							We've sent a confirmation email to <strong>{orderData.deliveryAddress.email}</strong>
						</p>
						<p style={styles.footerNote}>
							Keep your Order ID ({orderData.orderId}) for reference
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}

const styles = {
	emptyState: {
		textAlign: 'center',
		padding: '3rem 1rem'
	},
	successContainer: {
		margin: '2rem 0'
	},
	successIcon: {
		fontSize: '4rem',
		color: 'var(--success)',
		textAlign: 'center',
		marginBottom: '1rem'
	},
	successTitle: {
		textAlign: 'center',
		fontSize: '2rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 0.5rem 0'
	},
	successSubtitle: {
		textAlign: 'center',
		color: 'var(--text-secondary)',
		fontSize: '1rem',
		marginBottom: '2rem'
	},
	orderIdCard: {
		backgroundColor: 'var(--primary-light)',
		border: '2px solid var(--primary)',
		borderRadius: 'var(--radius-lg)',
		padding: '1.5rem',
		textAlign: 'center',
		marginBottom: '2rem'
	},
	orderIdLabel: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0 0 0.5rem 0'
	},
	orderIdValue: {
		fontSize: '1.75rem',
		fontWeight: '700',
		color: 'var(--primary)',
		margin: '0',
		fontFamily: 'monospace',
		letterSpacing: '2px'
	},
	orderIdHint: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0.75rem 0 0 0'
	},
	mainContent: {
		display: 'grid',
		gridTemplateColumns: '2fr 1.2fr',
		gap: '2rem',
		marginBottom: '2rem'
	},
	detailsSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem'
	},
	card: {
		backgroundColor: 'white',
		padding: '1.5rem',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)'
	},
	cardTitle: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	itemDetail: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		padding: '0.75rem 0',
		borderBottom: '1px solid var(--border-light)'
	},
	itemMeta: {
		flex: 1
	},
	itemName: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	itemVendor: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	},
	itemAmount: {
		textAlign: 'right'
	},
	qty: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	amount: {
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--primary)',
		margin: '0.25rem 0 0 0'
	},
	addressBox: {
		padding: '1rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)'
	},
	name: {
		fontSize: '1rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	address: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		margin: '0.5rem 0 0 0'
	},
	phone: {
		fontSize: '0.9rem',
		color: 'var(--text-primary)',
		margin: '0.75rem 0 0 0',
		fontWeight: '500'
	},
	email: {
		fontSize: '0.9rem',
		color: 'var(--text-primary)',
		margin: '0.25rem 0 0 0',
		fontWeight: '500'
	},
	infoBox: {
		backgroundColor: '#FEF3C7',
		border: '1px solid #F59E0B',
		borderRadius: 'var(--radius)',
		padding: '0.75rem',
		marginTop: '1rem'
	},
	infoText: {
		fontSize: '0.85rem',
		color: '#92400E',
		margin: 0
	},
	notes: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		margin: 0,
		lineHeight: '1.6',
		fontStyle: 'italic'
	},
	actionButtons: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	button: {
		padding: '0.75rem 1rem',
		border: 'none',
		borderRadius: 'var(--radius)',
		color: 'white',
		cursor: 'pointer',
		fontWeight: '600',
		fontSize: '0.95rem'
	},
	successMessage: {
		backgroundColor: '#DCFCE7',
		color: 'var(--success)',
		padding: '0.75rem 1rem',
		borderRadius: 'var(--radius)',
		textAlign: 'center',
		fontWeight: '600'
	},
	summarySection: {
		display: 'flex',
		flexDirection: 'column'
	},
	summaryCard: {
		backgroundColor: 'white',
		padding: '1.5rem',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)',
		position: 'sticky',
		top: '100px'
	},
	summaryTitle: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	summaryContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	summaryRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.9rem'
	},
	summaryTotal: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		paddingTop: '0.75rem',
		borderTop: '2px solid var(--primary)',
		marginTop: '0.5rem'
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1rem 0'
	},
	paymentInfo: {
		marginBottom: '1rem'
	},
	infoLabel: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	infoValue: {
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0.25rem 0 0 0'
	},
	trackingCard: {
		backgroundColor: 'var(--primary-light)',
		padding: '1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)',
		marginBottom: '1rem'
	},
	trackingLabel: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	trackingLink: {
		color: 'var(--primary)',
		textDecoration: 'none',
		fontWeight: '500',
		fontSize: '0.9rem'
	},
	supportBox: {
		backgroundColor: '#F0F9FF',
		padding: '1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid #BFE3FF'
	},
	supportTitle: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	supportLink: {
		display: 'block',
		color: 'var(--secondary)',
		textDecoration: 'none',
		fontWeight: '500',
		fontSize: '0.9rem',
		marginTop: '0.5rem'
	},
	supportPhone: {
		fontSize: '0.9rem',
		color: 'var(--secondary)',
		margin: '0.5rem 0 0 0',
		fontWeight: '500'
	},
	confirmationFooter: {
		backgroundColor: 'var(--primary-light)',
		padding: '1.5rem',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--green-200)',
		textAlign: 'center'
	},
	footerNote: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: '0.5rem 0 0 0'
	}
};

export default OrderConfirmation;
