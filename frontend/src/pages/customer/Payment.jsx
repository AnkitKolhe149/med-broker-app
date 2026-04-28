import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
	ArrowLeft,
	BadgeCheck,
	Banknote,
	CircleHelp,
	CreditCard,
	QrCode,
	ShieldCheck,
	Smartphone,
	Wallet
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatConvertedCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import paymentService from '../../services/payment.service';
import styles from './Payment.module.css';

function Payment() {
	const navigate = useNavigate();
	const location = useLocation();
	const { showError } = useNotification();
	const { clearCart } = useCart();
	const { currency, exchangeRates, convert } = useCurrency();
	const [orderData, setOrderData] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState('upi');
	const [loading, setLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [upiId, setUpiId] = useState('customer@upi');
	const [cardHolderName, setCardHolderName] = useState('');
	const [cardNumber, setCardNumber] = useState('');
	const [expiry, setExpiry] = useState('');
	const [cvv, setCvv] = useState('');
	const currentCurrency = currency || 'INR';
	const sourceCurrencyCode = orderData?.currencyCode || currentCurrency;
	const formatPrice = (value, fromCurrency = sourceCurrencyCode) => formatConvertedCurrency(value, fromCurrency, currentCurrency, exchangeRates, true);
	const toDisplayAmount = (value, fromCurrency = sourceCurrencyCode) => (typeof convert === 'function' ? convert(value, fromCurrency) : value);
	const queryOrderId = new URLSearchParams(location.search).get('orderId');

	const normalizeOrderData = (source) => {
		const snapshot = source?.checkoutSnapshot && typeof source.checkoutSnapshot === 'object' ? source.checkoutSnapshot : {};
		const pricingSummary = snapshot.pricingSummary && typeof snapshot.pricingSummary === 'object' ? snapshot.pricingSummary : {};
		const backendItems = Array.isArray(source?.items)
			? source.items.map((item) => ({
				medicineId: item.medicineId,
				name: item.medicine?.name || 'Medicine',
				vendor: item.vendor?.companyName || item.vendor?.name || 'Verified Partner',
				quantity: item.quantity,
				basePrice: Number(item.unitPriceCents || 0) / 100
			}))
			: [];

		return {
			...snapshot,
			orderId: source?.id || source?.orderId || snapshot.orderId || queryOrderId,
			cartItems: snapshot.cartItems || backendItems,
			deliveryAddress: snapshot.deliveryAddress || {},
			deliveryType: snapshot.deliveryType || 'standard',
			orderNotes: snapshot.orderNotes || '',
			prescriptionUrl: snapshot.prescriptionUrl || '',
			prescriptionName: snapshot.prescriptionName || '',
			discountPercent: snapshot.discountPercent ?? 0,
			appliedCoupon: snapshot.appliedCoupon || '',
				currencyCode: snapshot.currencyCode || currentCurrency,
			subtotalBase: snapshot.subtotalBase ?? snapshot.subtotal ?? ((pricingSummary.subtotalCents || 0) / 100),
			subtotal: snapshot.subtotal ?? ((pricingSummary.subtotalCents || 0) / 100),
			discountBase: snapshot.discountBase ?? snapshot.discount ?? ((pricingSummary.discountCents || 0) / 100),
			discount: snapshot.discount ?? ((pricingSummary.discountCents || 0) / 100),
			deliveryBase: snapshot.deliveryBase ?? snapshot.deliveryCharge ?? ((pricingSummary.deliveryChargeCents || 0) / 100),
			deliveryCharge: snapshot.deliveryCharge ?? ((pricingSummary.deliveryChargeCents || 0) / 100),
			taxBase: snapshot.taxBase ?? snapshot.tax ?? ((pricingSummary.taxCents || 0) / 100),
			tax: snapshot.tax ?? ((pricingSummary.taxCents || 0) / 100),
			totalBase: snapshot.totalBase ?? snapshot.total ?? ((pricingSummary.totalCents || 0) / 100),
			total: snapshot.total ?? ((pricingSummary.totalCents || 0) / 100),
			paymentProvider: snapshot.paymentProvider || 'razorpay',
			paymentMethod: snapshot.paymentMethod || 'Razorpay Secure Checkout'
		};
	};

	useEffect(() => {
		const pendingOrder = sessionStorage.getItem('pending_order');
		if (pendingOrder) {
			try {
				setOrderData(normalizeOrderData(JSON.parse(pendingOrder)));
			} catch (error) {
				console.error('Failed to parse order data:', error);
				navigate('/customer/cart');
			}
			setLoading(false);
			return;
		}

		if (!queryOrderId) {
			navigate('/customer/cart');
			setLoading(false);
			return;
		}

		const loadOrder = async () => {
			try {
				const backendOrder = await orderService.getCustomerOrderById(queryOrderId);
				setOrderData(normalizeOrderData(backendOrder));
			} catch (error) {
				console.error('Failed to load order from backend:', error);
				navigate('/customer/cart');
			} finally {
				setLoading(false);
			}
		};

		loadOrder();
	}, [navigate]);

	const calculateTotal = () => {
		if (!orderData) return 0;
		if (orderData.totalBase !== undefined && orderData.totalBase !== null) {
			return toDisplayAmount(Number(orderData.total || orderData.totalBase || 0), sourceCurrencyCode);
		}
		return toDisplayAmount(Number(orderData.total || 0), sourceCurrencyCode);
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

	const loadRazorpayScript = () => new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://checkout.razorpay.com/v1/checkout.js';
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});

	const getSubtotal = () => {
		if (!orderData) return 0;
		if (orderData.subtotalBase !== undefined && orderData.subtotalBase !== null) {
			return toDisplayAmount(Number(orderData.subtotal || orderData.subtotalBase || 0), sourceCurrencyCode);
		}
		return toDisplayAmount(Number(orderData.subtotal || 0), sourceCurrencyCode);
	};

	const calculateDelivery = () => {
		if (!orderData) return 0;
		const rawDelivery = Number(orderData.deliveryCharge ?? orderData.deliveryBase ?? (orderData.deliveryType === 'express' ? 9 : 0));
		return toDisplayAmount(rawDelivery, sourceCurrencyCode);
	};

	const calculateTax = () => {
		if (orderData?.tax !== undefined && orderData?.tax !== null) {
			return toDisplayAmount(Number(orderData.tax), sourceCurrencyCode);
		}
		const subtotal = getSubtotal();
		const discount = Number(orderData?.discount || ((subtotal * (orderData?.discountPercent || 0)) / 100));
		return Number(((subtotal - discount + calculateDelivery()) * 0.05).toFixed(2));
	};

	const paymentMethodMeta = {
		razorpay: {
			icon: <ShieldCheck size={18} strokeWidth={1.7} />,
			title: 'Razorpay Secure Checkout',
			subtitle: 'Verified gateway for UPI, cards and wallets'
		},
		upi: {
			icon: <QrCode size={18} strokeWidth={1.7} />,
			title: 'UPI QR / UPI ID',
			subtitle: 'Instant transfer with any UPI app'
		},
		card: {
			icon: <CreditCard size={18} strokeWidth={1.7} />,
			title: 'Credit / Debit Card',
			subtitle: 'Protected by SSL and PCI standards'
		},
		wallet: {
			icon: <Wallet size={18} strokeWidth={1.7} />,
			title: 'MedIQ Wallet',
			subtitle: 'Use wallet balance or top-up'
		},
		cod: {
			icon: <Banknote size={18} strokeWidth={1.7} />,
			title: 'Cash on Delivery',
			subtitle: 'Currently unavailable'
		}
	};

	const handlePaymentProcess = async (e) => {
		e.preventDefault();
		setIsProcessing(true);

		try {
			const totalAmount = calculateTotal();
			const backendOrderId = orderData?.orderId;

			if (!backendOrderId) {
				throw new Error('Missing backend order ID. Please retry checkout.');
			}

			const initiatedPayment = await paymentService.initiatePayment({
				orderId: backendOrderId,
				provider: 'razorpay',
				returnUrl: `${window.location.origin}/customer/payment?orderId=${backendOrderId}`
			});

			if (initiatedPayment?.provider === 'razorpay' && initiatedPayment?.razorpay) {
				const scriptReady = await loadRazorpayScript();
				if (!scriptReady) {
					throw new Error('Unable to load Razorpay checkout');
				}

				await new Promise((resolve, reject) => {
					const razorpay = new window.Razorpay({
						key: initiatedPayment.razorpay.keyId,
						amount: initiatedPayment.razorpay.amount,
						currency: initiatedPayment.razorpay.currency,
						name: initiatedPayment.razorpay.name,
						description: initiatedPayment.razorpay.description,
						order_id: initiatedPayment.razorpay.orderId,
						prefill: initiatedPayment.razorpay.prefill,
						notes: initiatedPayment.razorpay.notes,
						theme: initiatedPayment.razorpay.theme,
						modal: {
							ondismiss: () => reject(new Error('Payment was closed before completion'))
						},
						handler: async (response) => {
							try {
								await paymentService.verifyPayment({
									paymentId: initiatedPayment.paymentId,
									orderId: backendOrderId,
									status: 'SUCCEEDED',
									gatewayOrderId: response.razorpay_order_id,
									gatewayPaymentId: response.razorpay_payment_id,
									signature: response.razorpay_signature
								});
								resolve();
							} catch (error) {
								reject(error);
							}
						}
					});

					razorpay.on('payment.failed', (response) => {
						reject(new Error(response?.error?.description || 'Razorpay payment failed'));
					});

					razorpay.open();
				});
			} else {
				if (!initiatedPayment?.paymentId) {
					throw new Error('No payment id received');
				}

				// Simulate user confirmation in mock mode
				await new Promise((resolve) => setTimeout(resolve, 1000));

				await paymentService.verifyPayment({
					paymentId: initiatedPayment.paymentId,
					orderId: backendOrderId,
					status: 'SUCCEEDED'
				});
			}

			const orderId = backendOrderId;

			const completedOrder = {
				...orderData,
				orderId,
				paymentMethod,
				paymentStatus: 'completed',
				orderStatus: 'confirmed',
				completedAt: new Date().toISOString(),
				total: totalAmount,
				totalBase: totalAmount
			};

			sessionStorage.setItem('completed_order', JSON.stringify(completedOrder));
			sessionStorage.removeItem('pending_order');
			clearCart();

			navigate(`/customer/order-confirmation/${orderId}`);

		} catch (error) {
			console.error('Payment failed:', error);
			showError(error?.response?.data?.message || error.message || 'Payment failed');
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
	const subtotal = getSubtotal();
	const deliveryCharge = calculateDelivery();
	const tax = calculateTax();
	const discount = (subtotal * (orderData.discountPercent || 0)) / 100;

	return (
		<main className={`page ${styles.paymentPage}`}>
			<div className={`container ${styles.paymentContainer}`}>
				<div className={styles.breadcrumbRow}>
					<button type="button" className={styles.breadcrumbLink} onClick={() => navigate('/customer/checkout')}>
						<ArrowLeft size={14} strokeWidth={1.8} /> Back to Shipping
					</button>
					<span>›</span>
					<span>Payment</span>
					<span>›</span>
					<span className={styles.breadcrumbActive}>Confirmation</span>
				</div>

				<div className={styles.layoutGrid}>
					<section className={styles.formPanel}>
						<div className={styles.titleWrap}>
							<h1 className={styles.pageTitle}>Complete Payment</h1>
							<p className={styles.pageSubtitle}>Your payment is processed through Razorpay Secure Checkout.</p>
						</div>

						<div className={styles.securityCard} style={{ marginBottom: '1rem' }}>
							<ShieldCheck size={16} strokeWidth={1.8} />
							<div>
								<p className={styles.securityTitle}>Razorpay Checkout Enabled</p>
								<p className={styles.securityText}>You can pay with UPI, cards, netbanking, or wallets through Razorpay's hosted checkout.</p>
							</div>
						</div>

						<form onSubmit={handlePaymentProcess} className={styles.formContainer}>
							<div className={styles.methodList}>
								{[
									{ key: 'upi', disabled: false },
									{ key: 'card', disabled: false },
									{ key: 'wallet', disabled: false },
									{ key: 'cod', disabled: true }
								].map(({ key, disabled }) => (
									<label
										key={key}
										className={`${styles.methodCard} ${paymentMethod === key ? styles.methodCardActive : ''} ${disabled ? styles.methodCardDisabled : ''}`}
									>
										<input
											type="radio"
											name="paymentMethod"
											value={key}
											disabled={disabled}
											checked={paymentMethod === key}
											onChange={(e) => setPaymentMethod(e.target.value)}
										/>
										<div className={styles.methodIcon}>{paymentMethodMeta[key].icon}</div>
										<div className={styles.methodTextWrap}>
											<p className={styles.methodTitle}>{paymentMethodMeta[key].title}</p>
											<p className={styles.methodSubtitle}>{paymentMethodMeta[key].subtitle}</p>
										</div>
										{!disabled && paymentMethod === key ? <BadgeCheck size={16} strokeWidth={1.8} className={styles.methodBadge} /> : null}
									</label>
								))}
							</div>

							{paymentMethod === 'upi' && (
								<div className={styles.methodDetails}>
									<div className={styles.qrBlock}>
										<p className={styles.qrLabel}><Smartphone size={14} strokeWidth={1.8} /> Scan in any UPI app</p>
										<div className={styles.qrCanvasWrap}>
											<QRCodeSVG value={generateQRCode()} size={210} level="H" includeMargin />
										</div>
										<p className={styles.qrHint}>Google Pay, PhonePe, Paytm and all major UPI apps are supported.</p>
									</div>

									<div className={styles.upiFields}>
										<div className={styles.formGroup}>
											<label className={styles.label}>Your UPI ID</label>
											<input
												type="text"
												value={upiId}
												onChange={(e) => setUpiId(e.target.value)}
												placeholder="example@upi"
												className={styles.input}
											/>
										</div>
										<a className={styles.intentLink} href={generateUPILink()}>Open UPI Intent Link</a>
									</div>
								</div>
							)}

							{paymentMethod === 'card' && (
								<div className={styles.methodDetails}>
									<div className={styles.formGroup}>
										<label className={styles.label}>Cardholder Name</label>
										<input type="text" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} placeholder="Full name on card" className={styles.input} />
									</div>
									<div className={styles.formGroup}>
										<label className={styles.label}>Card Number</label>
										<input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} className={styles.input} />
									</div>
									<div className={styles.twoColumn}>
										<div className={styles.formGroup}>
											<label className={styles.label}>Expiry</label>
											<input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className={styles.input} />
										</div>
										<div className={styles.formGroup}>
											<label className={styles.label}>CVV</label>
											<input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" maxLength={4} className={styles.input} />
										</div>
									</div>
								</div>
							)}

							{paymentMethod === 'wallet' && (
								<div className={styles.methodDetails}>
									<div className={styles.walletCard}>
										<p className={styles.walletLabel}>Available Wallet Balance</p>
										<p className={styles.walletAmount}>{formatPrice(0, currentCurrency)}</p>
										<button type="button" className={styles.walletButton}>Add Funds</button>
									</div>
								</div>
							)}

							<button type="submit" disabled={isProcessing} className={styles.payButton}>
								{isProcessing ? 'Processing Payment...' : `Pay ${formatPrice(total, currentCurrency)}`}
							</button>

							<p className={styles.disclaimer}>By proceeding, you authorize MedIQ to process this transaction securely.</p>
						</form>
					</section>

					<aside className={styles.summaryPanel}>
						<h2 className={styles.summaryTitle}>Order Review</h2>
						<div className={styles.orderMetaCard}>
							<p><span>Order ID</span><strong>{orderData.orderId}</strong></p>
							<p><span>Payment Method</span><strong>{orderData.paymentMethod || paymentMethodMeta[paymentMethod]?.title || 'Razorpay Secure Checkout'}</strong></p>
							<p><span>Delivery</span><strong>{orderData.deliveryType === 'express' ? 'Express (1-3 days)' : 'Standard (5-7 days)'}</strong></p>
						</div>

						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Delivery Address</h3>
							<p className={styles.addressText}>
								{orderData.deliveryAddress.fullName}<br />
								{orderData.deliveryAddress.address}<br />
								{orderData.deliveryAddress.city}, {orderData.deliveryAddress.state} {orderData.deliveryAddress.zipCode}<br />
								Phone: {orderData.deliveryAddress.phone}
							</p>
						</div>

						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Items ({orderData.cartItems.length})</h3>
							{orderData.cartItems.map((item, index) => (
								<div key={`${item.medicineId}-${index}`} className={styles.itemRow}>
									<span>{item.name} × {item.quantity}</span>
									<span>{formatPrice(item.basePrice * item.quantity, item.currencyCode || sourceCurrencyCode)}</span>
								</div>
							))}
						</div>

						<div className={styles.amountRows}>
							<div className={styles.pricingRow}><span>Subtotal</span><strong>{formatPrice(subtotal, currentCurrency)}</strong></div>
							{orderData.discountPercent > 0 ? (
								<div className={styles.pricingRowDiscount}><span>Discount ({orderData.discountPercent}%)</span><strong>-{formatPrice(discount, currentCurrency)}</strong></div>
							) : null}
							<div className={styles.pricingRow}><span>Shipping</span><strong>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge, currentCurrency)}</strong></div>
							<div className={styles.pricingRow}><span className={styles.taxLabel}>Estimated Tax <CircleHelp size={13} strokeWidth={1.8} /></span><strong>{formatPrice(tax, currentCurrency)}</strong></div>
							<div className={styles.totalRow}><span>Total Due</span><strong>{formatPrice(total, currentCurrency)}</strong></div>
						</div>

						<div className={styles.securityCard}>
							<ShieldCheck size={16} strokeWidth={1.8} />
							<div>
								<p className={styles.securityTitle}>Secure Checkout</p>
								<p className={styles.securityText}>End-to-end encryption, PCI compliant transactions.</p>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}
export default Payment;
