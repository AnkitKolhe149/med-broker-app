import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useNotification } from '../../context/NotificationContext';

function Payment() {
	const navigate = useNavigate();
	const { showError } = useNotification();
	const [orderData, setOrderData] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState('upi');
	const [loading, setLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [upiId, setUpiId] = useState('customer@upi');

	useEffect(() => {
		const pendingOrder = sessionStorage.getItem('pending_order');
		if (pendingOrder) {
			try {
				setOrderData(JSON.parse(pendingOrder));
			} catch (error) {
				console.error('Failed to parse order data:', error);
				navigate('/customer/cart');
			}
		} else {
			navigate('/customer/cart');
		}
		setLoading(false);
	}, [navigate]);

	const calculateTotal = () => {
		if (!orderData) return 0;
		const subtotal = orderData.subtotal;
		const discount = (subtotal * orderData.discountPercent) / 100;
		const deliveryCharge = subtotal > 500 ? 0 : 50;
		const tax = (subtotal - discount + deliveryCharge) * 0.05;
		return subtotal - discount + deliveryCharge + tax;
	};

	const generateUPILink = () => {
		const amount = calculateTotal();
		const upiString = `upi://pay?pa=${upiId}&pn=MedBroker&am=${amount}&tn=Medicine%20Purchase&tr=${generateTransactionId()}`;
		return upiString;
	};

	const generateTransactionId = () => {
		return 'MED' + Date.now() + Math.random().toString(36).substr(2, 9);
	};

	const generateQRCode = () => {
		const amount = calculateTotal();
		const merchantUPI = 'medbroker@icici';
		const transactionId = generateTransactionId();
		const upiString = `upi://pay?pa=${merchantUPI}&pn=MedBroker&am=${amount}&tn=Medicine%20Purchase&tr=${transactionId}`;
		return upiString;
	};

	const handlePaymentProcess = async (e) => {
		e.preventDefault();
		setIsProcessing(true);

		try {
			// Simulate payment processing
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Generate Order ID
			const orderId = 'ORD' + Date.now();

			// Store order data (in real implementation, this would be in DB)
			const completedOrder = {
				...orderData,
				orderId,
				paymentMethod,
				paymentStatus: 'completed',
				orderStatus: 'confirmed',
				completedAt: new Date().toISOString(),
				total: calculateTotal()
			};

			// Store in sessionStorage for order confirmation page
			sessionStorage.setItem('completed_order', JSON.stringify(completedOrder));
			sessionStorage.removeItem('pending_order');

			// Navigate to order confirmation
			navigate(`/customer/order-confirmation/${orderId}`);
		} catch (error) {
			console.error('Payment failed:', error);
			showError('Payment processing failed. Please try again.');
		} finally {
			setIsProcessing(false);
		}
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading payment details...</p>
			</div>
		);
	}

	if (!orderData) {
		return (
			<main className="page">
				<div className="container">
					<div style={styles.emptyState}>
						<p>Order data not found. Redirecting to cart...</p>
					</div>
				</div>
			</main>
		);
	}

	const total = calculateTotal();

	return (
		<main className="page">
			<div className="container">
				<h1 className="section-title">Payment</h1>

				<div style={styles.mainContent}>
					{/* Left: Payment Methods */}
					<div style={styles.paymentSection}>
						<form onSubmit={handlePaymentProcess} style={styles.formContainer}>
							{/* UPI Payment */}
							<div style={styles.paymentMethodCard}>
								<label style={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="upi"
										checked={paymentMethod === 'upi'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										style={styles.radioInput}
									/>
									<span style={styles.methodTitle}>UPI (Recommended)</span>
								</label>

								{paymentMethod === 'upi' && (
									<div style={styles.methodDetails}>
										<div style={styles.qrContainer}>
											<p style={styles.qrLabel}>Scan with any UPI App</p>
											<QRCodeSVG 
												value={generateQRCode()} 
												size={250}
												level="H"
												includeMargin={true}
											/>
											<p style={styles.qrHint}>
												Scan the QR code with Google Pay, PhonePe, Paytm or any UPI app
											</p>
										</div>

										<p style={styles.orDivider}>OR</p>

										<div style={styles.upiInputField}>
											<label style={styles.label}>Enter UPI ID</label>
											<input
												type="text"
												value={upiId}
												onChange={(e) => setUpiId(e.target.value)}
												placeholder="example@upi"
												style={styles.input}
											/>
										</div>
									</div>
								)}
							</div>

							{/* Card Payment */}
							<div style={styles.paymentMethodCard}>
								<label style={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="card"
										checked={paymentMethod === 'card'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										style={styles.radioInput}
									/>
									<span style={styles.methodTitle}>Credit/Debit Card</span>
								</label>

								{paymentMethod === 'card' && (
									<div style={styles.methodDetails}>
										<div style={styles.formGroup}>
											<label style={styles.label}>Cardholder Name</label>
											<input
												type="text"
												placeholder="Full name on card"
												style={styles.input}
											/>
										</div>
										<div style={styles.formGroup}>
											<label style={styles.label}>Card Number</label>
											<input
												type="text"
												placeholder="1234 5678 9012 3456"
												maxLength="19"
												style={styles.input}
											/>
										</div>
										<div style={styles.twoColumn}>
											<div style={styles.formGroup}>
												<label style={styles.label}>Expiry (MM/YY)</label>
												<input
													type="text"
													placeholder="MM/YY"
													maxLength="5"
													style={styles.input}
												/>
											</div>
											<div style={styles.formGroup}>
												<label style={styles.label}>CVV</label>
												<input
													type="text"
													placeholder="123"
													maxLength="4"
													style={styles.input}
												/>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Wallet Payment */}
							<div style={styles.paymentMethodCard}>
								<label style={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="wallet"
										checked={paymentMethod === 'wallet'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										style={styles.radioInput}
									/>
									<span style={styles.methodTitle}>MedBroker Wallet</span>
								</label>

								{paymentMethod === 'wallet' && (
									<div style={styles.methodDetails}>
										<div style={styles.walletBalance}>
											<p style={styles.balanceLabel}>Available Balance</p>
											<p style={styles.balanceAmount}>₹0.00</p>
											<button type="button" style={styles.addFundsButton}>
												+ Add Funds to Wallet
											</button>
										</div>
									</div>
								)}
							</div>

							{/* COD - Disabled for now */}
							<div style={{ ...styles.paymentMethodCard, opacity: 0.5, pointerEvents: 'none' }}>
								<label style={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="cod"
										disabled
										style={styles.radioInput}
									/>
									<span style={styles.methodTitle}>Cash on Delivery (Coming Soon)</span>
								</label>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={isProcessing}
								style={{
									...styles.payButton,
									opacity: isProcessing ? 0.6 : 1,
									cursor: isProcessing ? 'not-allowed' : 'pointer'
								}}
							>
								{isProcessing ? 'Processing Payment...' : `Pay ₹${total.toFixed(2)}`}
							</button>

							<p style={styles.disclaimer}>
								By proceeding, you agree to our terms. Your payment is secure and encrypted.
							</p>
						</form>
					</div>

					{/* Right: Order Summary */}
					<div style={styles.summarySection}>
						<div style={styles.summaryCard}>
							<h2 style={styles.summaryTitle}>Order Summary</h2>

							{/* Address */}
							<div style={styles.section}>
								<h3 style={styles.sectionTitle}>Delivery Address</h3>
								<p style={styles.addressText}>
									{orderData.deliveryAddress.fullName}<br />
									{orderData.deliveryAddress.address}<br />
									{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}<br />
									Phone: {orderData.deliveryAddress.phone}
								</p>
							</div>

							<hr style={styles.divider} />

							{/* Items */}
							<div style={styles.section}>
								<h3 style={styles.sectionTitle}>Items ({orderData.cartItems.length})</h3>
								{orderData.cartItems.map(item => (
									<div key={item.medicineId} style={styles.itemRow}>
										<span>{item.name} × {item.quantity}</span>
										<span>₹{(item.basePrice * item.quantity).toFixed(2)}</span>
									</div>
								))}
							</div>

							<hr style={styles.divider} />

							{/* Pricing */}
							<div style={styles.section}>
								<div style={styles.pricingRow}>
									<span>Subtotal</span>
									<span>₹{orderData.subtotal.toFixed(2)}</span>
								</div>
								{orderData.discountPercent > 0 && (
									<div style={{ ...styles.pricingRow, color: 'var(--success)' }}>
										<span>Discount ({orderData.discountPercent}%)</span>
										<span>−₹{((orderData.subtotal * orderData.discountPercent) / 100).toFixed(2)}</span>
									</div>
								)}
								<div style={styles.pricingRow}>
									<span>Delivery</span>
									<span>{orderData.subtotal > 500 ? 'Free' : '₹50'}</span>
								</div>
								<div style={styles.pricingRow}>
									<span>Tax (5% GST)</span>
									<span>₹{(((orderData.subtotal * (100 - orderData.discountPercent) / 100) + (orderData.subtotal > 500 ? 0 : 50)) * 0.05).toFixed(2)}</span>
								</div>
								<div style={styles.totalRow}>
									<span>Total Amount Due</span>
									<span>₹{total.toFixed(2)}</span>
								</div>
							</div>

							{/* Security Badge */}
							<div style={styles.securityBadge}>
								<span style={styles.badgeIcon}>🔒</span>
								<div>
									<p style={styles.badgeTitle}>Secure Payment</p>
									<p style={styles.badgeText}>SSL encrypted & PCI compliant</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

const styles = {
	mainContent: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr',
		gap: '2rem',
		marginTop: '2rem'
	},
	emptyState: {
		textAlign: 'center',
		padding: '3rem 1rem'
	},
	paymentSection: {
		display: 'flex',
		flexDirection: 'column'
	},
	formContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	paymentMethodCard: {
		backgroundColor: 'white',
		padding: '1.5rem',
		borderRadius: 'var(--radius-lg)',
		border: '2px solid var(--border)',
		boxShadow: 'var(--shadow-sm)'
	},
	radioLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		cursor: 'pointer',
		marginBottom: '1rem'
	},
	radioInput: {
		width: '20px',
		height: '20px',
		cursor: 'pointer',
		accentColor: 'var(--primary)'
	},
	methodTitle: {
		fontSize: '1rem',
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	methodDetails: {
		marginLeft: '2.25rem',
		paddingTop: '1rem',
		borderTop: '1px solid var(--border)'
	},
	qrContainer: {
		textAlign: 'center',
		padding: '1.5rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		marginBottom: '1rem'
	},
	qrLabel: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		marginBottom: '1rem',
		margin: 0
	},
	qrHint: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		marginTop: '1rem',
		margin: '1rem 0 0 0'
	},
	orDivider: {
		textAlign: 'center',
		color: 'var(--text-secondary)',
		margin: '1rem 0'
	},
	upiInputField: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	label: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	input: {
		padding: '0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		outline: 'none',
		transition: 'border-color 0.2s'
	},
	formGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	twoColumn: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem'
	},
	walletBalance: {
		textAlign: 'center',
		padding: '1rem',
		backgroundColor: '#FEF3C7',
		borderRadius: 'var(--radius)',
		border: '1px solid #F59E0B'
	},
	balanceLabel: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	balanceAmount: {
		fontSize: '1.75rem',
		fontWeight: '700',
		color: '#92400E',
		margin: '0.5rem 0'
	},
	addFundsButton: {
		backgroundColor: '#F59E0B',
		color: 'white',
		border: 'none',
		padding: '0.5rem 1rem',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontWeight: '600',
		marginTop: '0.5rem',
		width: '100%'
	},
	payButton: {
		width: '100%',
		padding: '1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius-lg)',
		fontWeight: '600',
		fontSize: '1rem',
		cursor: 'pointer',
		marginTop: '1rem'
	},
	disclaimer: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		textAlign: 'center',
		margin: '1rem 0 0 0'
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
	section: {
		marginBottom: '1rem'
	},
	sectionTitle: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0 0 0.75rem 0'
	},
	addressText: {
		fontSize: '0.85rem',
		lineHeight: '1.6',
		color: 'var(--text-secondary)',
		margin: 0
	},
	itemRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.5rem'
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1rem 0'
	},
	pricingRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.5rem'
	},
	totalRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		paddingTop: '0.75rem',
		borderTop: '2px solid var(--primary)',
		marginTop: '0.5rem'
	},
	securityBadge: {
		display: 'flex',
		gap: '0.75rem',
		padding: '0.75rem',
		backgroundColor: '#DCFCE7',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)',
		marginTop: '1rem'
	},
	badgeIcon: {
		fontSize: '1.5rem',
		flexShrink: 0
	},
	badgeTitle: {
		fontSize: '0.85rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0'
	},
	badgeText: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0'
	}
};

export default Payment;
