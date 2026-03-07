import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useNotification } from '../../context/NotificationContext';
import styles from './Payment.module.css';

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
					<div className={styles.emptyState}>
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
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">Payment</h1>
						<p className="section-subtitle">Select a payment method to complete your order</p>
					</div>
				</div>

				<div className={styles.mainContent}>
					{/* Left: Payment Methods */}
					<section className="section" style={{ padding: '2rem' }}>
						<form onSubmit={handlePaymentProcess} className={styles.formContainer}>
							{/* UPI Payment */}
							<div className={styles.paymentMethodCard}>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="upi"
										checked={paymentMethod === 'upi'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										className={styles.radioInput}
									/>
									<span className={styles.methodTitle}>UPI (Recommended)</span>
								</label>

								{paymentMethod === 'upi' && (
									<div className={styles.methodDetails}>
										<div className={styles.qrContainer}>
											<p className={styles.qrLabel}>Scan with any UPI App</p>
											<QRCodeSVG 
												value={generateQRCode()} 
												size={250}
												level="H"
												includeMargin={true}
											/>
											<p className={styles.qrHint}>
												Scan the QR code with Google Pay, PhonePe, Paytm or any UPI app
											</p>
										</div>

										<p className={styles.orDivider}>OR</p>

										<div className={styles.upiInputField}>
											<label className={styles.label}>Enter UPI ID</label>
											<input
												type="text"
												value={upiId}
												onChange={(e) => setUpiId(e.target.value)}
												placeholder="example@upi"
												className={styles.input}
											/>
										</div>
									</div>
								)}
							</div>

							{/* Card Payment */}
							<div className={styles.paymentMethodCard}>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="card"
										checked={paymentMethod === 'card'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										className={styles.radioInput}
									/>
									<span className={styles.methodTitle}>Credit/Debit Card</span>
								</label>

								{paymentMethod === 'card' && (
									<div className={styles.methodDetails}>
										<div className={styles.formGroup}>
											<label className={styles.label}>Cardholder Name</label>
											<input
												type="text"
												placeholder="Full name on card"
												className={styles.input}
											/>
										</div>
										<div className={styles.formGroup}>
											<label className={styles.label}>Card Number</label>
											<input
												type="text"
												placeholder="1234 5678 9012 3456"
												maxLength="19"
												className={styles.input}
											/>
										</div>
										<div className={styles.twoColumn}>
											<div className={styles.formGroup}>
												<label className={styles.label}>Expiry (MM/YY)</label>
												<input
													type="text"
													placeholder="MM/YY"
													maxLength="5"
													className={styles.input}
												/>
											</div>
											<div className={styles.formGroup}>
												<label className={styles.label}>CVV</label>
												<input
													type="text"
													placeholder="123"
													maxLength="4"
													className={styles.input}
												/>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Wallet Payment */}
							<div className={styles.paymentMethodCard}>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="wallet"
										checked={paymentMethod === 'wallet'}
										onChange={(e) => setPaymentMethod(e.target.value)}
										className={styles.radioInput}
									/>
									<span className={styles.methodTitle}>MedBroker Wallet</span>
								</label>

								{paymentMethod === 'wallet' && (
									<div className={styles.methodDetails}>
										<div className={styles.walletBalance}>
											<p className={styles.balanceLabel}>Available Balance</p>
											<p className={styles.balanceAmount}>₹0.00</p>
											<button type="button" className={styles.addFundsButton}>
												+ Add Funds to Wallet
											</button>
										</div>
									</div>
								)}
							</div>

							{/* COD - Disabled for now */}
							<div className={styles.paymentMethodCard} style={{ opacity: 0.5, pointerEvents: 'none' }}>
								<label className={styles.radioLabel}>
									<input
										type="radio"
										name="paymentMethod"
										value="cod"
										disabled
										className={styles.radioInput}
									/>
									<span className={styles.methodTitle}>Cash on Delivery (Coming Soon)</span>
								</label>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={isProcessing}
								className={styles.payButton}
								style={{
									opacity: isProcessing ? 0.6 : 1,
									cursor: isProcessing ? 'not-allowed' : 'pointer'
								}}
							>
								{isProcessing ? 'Processing Payment...' : `Pay ₹${total.toFixed(2)}`}
							</button>

							<p className={styles.disclaimer}>
								By proceeding, you agree to our terms. Your payment is secure and encrypted.
							</p>
						</form>
					</section>

					{/* Right: Order Summary */}
					<div className={styles.summarySection}>
						<div className={styles.summaryCard}>
							<h2 className={styles.summaryTitle}>Order Summary</h2>

							{/* Address */}
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>Delivery Address</h3>
								<p className={styles.addressText}>
									{orderData.deliveryAddress.fullName}<br />
									{orderData.deliveryAddress.address}<br />
									{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}<br />
									Phone: {orderData.deliveryAddress.phone}
								</p>
							</div>

							<hr className={styles.divider} />

							{/* Items */}
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>Items ({orderData.cartItems.length})</h3>
								{orderData.cartItems.map(item => (
									<div key={item.medicineId} className={styles.itemRow}>
										<span>{item.name} × {item.quantity}</span>
										<span>₹{(item.basePrice * item.quantity).toFixed(2)}</span>
									</div>
								))}
							</div>

							<hr className={styles.divider} />

							{/* Pricing */}
							<div className={styles.section}>
								<div className={styles.pricingRow}>
									<span>Subtotal</span>
									<span>₹{orderData.subtotal.toFixed(2)}</span>
								</div>
								{orderData.discountPercent > 0 && (
									<div className={styles.pricingRow} style={{ color: 'var(--success)' }}>
										<span>Discount ({orderData.discountPercent}%)</span>
										<span>−₹{((orderData.subtotal * orderData.discountPercent) / 100).toFixed(2)}</span>
									</div>
								)}
								<div className={styles.pricingRow}>
									<span>Delivery</span>
									<span>{orderData.subtotal > 500 ? 'Free' : '₹50'}</span>
								</div>
								<div className={styles.pricingRow}>
									<span>Tax (5% GST)</span>
									<span>₹{(((orderData.subtotal * (100 - orderData.discountPercent) / 100) + (orderData.subtotal > 500 ? 0 : 50)) * 0.05).toFixed(2)}</span>
								</div>
								<div className={styles.totalRow}>
									<span>Total Amount Due</span>
									<span>₹{total.toFixed(2)}</span>
								</div>
							</div>

							{/* Security Badge */}
							<div className={styles.securityBadge}>
								<span className={styles.badgeIcon}>🔒</span>
								<div>
									<p className={styles.badgeTitle}>Secure Payment</p>
									<p className={styles.badgeText}>SSL encrypted & PCI compliant</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
export default Payment;
