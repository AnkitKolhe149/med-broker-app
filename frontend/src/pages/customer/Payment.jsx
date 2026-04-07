import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './Payment.module.css';

function Payment() {
	const navigate = useNavigate();
	const { showError } = useNotification();
	const [orderData, setOrderData] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState('upi');
	const [loading, setLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [upiId, setUpiId] = useState('customer@upi');
	const currencyCode = orderData?.currencyCode || localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);

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
		const upiString = `upi://pay?pa=${upiId}&pn=MedIQ&am=${amount}&tn=Medicine%20Purchase&tr=${generateTransactionId()}`;
		return upiString;
	};

	const generateTransactionId = () => {
		return 'MED' + Date.now() + Math.random().toString(36).substr(2, 9);
	};

	const generateQRCode = () => {
		const amount = calculateTotal();
		const merchantUPI = 'mediq@icici';
		const transactionId = generateTransactionId();
		const upiString = `upi://pay?pa=${merchantUPI}&pn=MedIQ&am=${amount}&tn=Medicine%20Purchase&tr=${transactionId}`;
		return upiString;
	};

const handlePaymentProcess = async (e) => {
	e.preventDefault();
	setIsProcessing(true);

	try {
		const totalAmount = calculateTotal();

		// 🔥 STEP 1: CREATE PAYMENT
		const res = await fetch("http://localhost:4000/api/custom-payments/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: totalAmount,
				userId: "user123",
				orderId: "order_" + Date.now(),
			}),
		});

		const data = await res.json();

		console.log("🔥 CREATE RESPONSE:", data);

		if (!data.paymentIntentId) {
			throw new Error("No paymentIntentId received");
		}

		// 🔥 STEP 2: SIMULATE SUCCESS
		await new Promise(resolve => setTimeout(resolve, 1000));

		// 🔥 STEP 3: UPDATE STATUS
		await fetch("http://localhost:4000/api/custom-payments/success", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				paymentIntentId: data.paymentIntentId,
			}),
		});

		// 🔥 STEP 4: PERSIST ORDER IN BACKEND
		const createdOrder = await orderService.createOrder({
			items: orderData.cartItems.map((item) => ({
				medicineId: item.medicineId,
				quantity: item.quantity
			})),
			prescriptionUrl: orderData.prescriptionUrl
		});

		// 🔥 STEP 5: COMPLETE ORDER
		const orderId = createdOrder.id;

		const completedOrder = {
			...orderData,
			orderId,
			paymentMethod,
			paymentStatus: 'completed',
			orderStatus: createdOrder.status || 'pending',
			completedAt: new Date().toISOString(),
			total: totalAmount
		};

		sessionStorage.setItem('completed_order', JSON.stringify(completedOrder));
		sessionStorage.removeItem('pending_order');

		navigate(`/customer/order-confirmation/${orderId}`);

	} catch (error) {
		console.error("❌ PAYMENT ERROR:", error);
		showError("Payment failed");
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
					<section className={styles.paymentSection}>
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
									<span className={styles.methodTitle}>MedIQ Wallet</span>
								</label>

								{paymentMethod === 'wallet' && (
									<div className={styles.methodDetails}>
										<div className={styles.walletBalance}>
											<p className={styles.balanceLabel}>Available Balance</p>
											<p className={styles.balanceAmount}>{formatPrice(0)}</p>
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
								{isProcessing ? 'Processing Payment...' : `Pay ${formatPrice(total)}`}
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
										<span>{formatPrice(item.basePrice * item.quantity)}</span>
									</div>
								))}
							</div>

							<hr className={styles.divider} />

							{/* Pricing */}
							<div className={styles.section}>
								<div className={styles.pricingRow}>
									<span>Subtotal</span>
									<span>{formatPrice(orderData.subtotal)}</span>
								</div>
								{orderData.discountPercent > 0 && (
									<div className={styles.pricingRow} style={{ color: 'var(--success)' }}>
										<span>Discount ({orderData.discountPercent}%)</span>
										<span>−{formatPrice((orderData.subtotal * orderData.discountPercent) / 100)}</span>
									</div>
								)}
								<div className={styles.pricingRow}>
									<span>Delivery</span>
									<span>{orderData.subtotal > 500 ? 'Free' : formatPrice(50)}</span>
								</div>
								<div className={styles.pricingRow}>
									<span>Tax (5% GST)</span>
									<span>{formatPrice((((orderData.subtotal * (100 - orderData.discountPercent) / 100) + (orderData.subtotal > 500 ? 0 : 50)) * 0.05))}</span>
								</div>
								<div className={styles.totalRow}>
									<span>Total Amount Due</span>
									<span>{formatPrice(total)}</span>
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
