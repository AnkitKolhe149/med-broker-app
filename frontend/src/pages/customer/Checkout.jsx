import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

function Checkout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cartItems, getTotalPrice } = useCart();
	const { user, loading: userLoading } = useUser();
	const { showError } = useNotification();

	// Form state
	const [deliveryType, setDeliveryType] = useState('home_delivery');
	const [deliveryAddress, setDeliveryAddress] = useState({
		fullName: '',
		phone: '',
		email: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'India'
	});

	const [orderNotes, setOrderNotes] = useState('');
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const discountPercent = location.state?.discountPercent || 0;
	const appliedCoupon = location.state?.appliedCoupon || '';

	useEffect(() => {
		if (user?.customer) {
			setDeliveryAddress(prev => ({
				...prev,
				fullName: user.customer.fullName || '',
				phone: user.customer.phoneNumber || '',
				email: user.email || '',
				address: user.customer.address || '',
				city: user.customer.city || '',
				state: user.customer.state || '',
				zipCode: user.customer.zipCode || '',
				country: 'India'
			}));
		}
	}, [user]);

	const handleAddressChange = (e) => {
		const { name, value } = e.target;
		setDeliveryAddress(prev => ({
			...prev,
			[name]: value
		}));
	};

	const validateForm = () => {
		if (!deliveryAddress.fullName.trim()) {
			showError('Please enter your full name');
			return false;
		}
		if (!deliveryAddress.phone.trim() || deliveryAddress.phone.length < 10) {
			showError('Please enter a valid phone number');
			return false;
		}
		if (!deliveryAddress.address.trim()) {
			showError('Please enter your address');
			return false;
		}
		if (!deliveryAddress.city.trim()) {
			showError('Please enter your city');
			return false;
		}
		if (!deliveryAddress.zipCode.trim()) {
			showError('Please enter your ZIP code');
			return false;
		}
		if (!agreeTerms) {
			showError('Please agree to the terms and conditions');
			return false;
		}
		return true;
	};

	const handlePlaceOrder = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			// In a real implementation, this would create the order in the database
			// For now, we'll store the order details and navigate to payment
			const orderData = {
				cartItems,
				deliveryAddress,
				deliveryType,
				orderNotes,
				discountPercent,
				appliedCoupon,
				subtotal: getTotalPrice(),
				timestamp: new Date().toISOString()
			};

			// Store in sessionStorage for payment page
			sessionStorage.setItem('pending_order', JSON.stringify(orderData));

			// Navigate to payment
			navigate('/customer/payment');
		} catch (error) {
			console.error('Failed to place order:', error);
			showError('Failed to place order. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (userLoading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<p>Loading checkout...</p>
			</div>
		);
	}

	if (cartItems.length === 0) {
		return (
			<main className="page">
				<div className="container">
					<div style={styles.emptyState}>
						<p>Your cart is empty. Please add items before checkout.</p>
						<button 
							onClick={() => navigate('/customer/catalog')}
							style={styles.backLink}
						>
							← Back to Catalog
						</button>
					</div>
				</div>
			</main>
		);
	}

	const subtotal = getTotalPrice();
	const discount = (subtotal * discountPercent) / 100;
	const deliveryCharge = subtotal > 500 ? 0 : 50;
	const tax = (subtotal - discount + deliveryCharge) * 0.05; // 5% GST
	const total = subtotal - discount + deliveryCharge + tax;

	return (
		<main className="page">
			<div className="container">
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">Checkout</h1>
						<p className="section-subtitle">Complete your delivery and payment details</p>
					</div>
				</div>

				<div style={styles.mainContent}>
					{/* Left: Delivery & Payment Form */}
					<section className="section" style={{ padding: '2rem' }}>
						<form onSubmit={handlePlaceOrder} style={styles.formContainer}>
							{/* Delivery Type */}
							<div style={styles.formCard}>
								<h2 style={styles.cardTitle}>Delivery Type</h2>
								<div style={styles.radioGroup}>
									<label style={styles.radioLabel}>
										<input
											type="radio"
											name="deliveryType"
											value="home_delivery"
											checked={deliveryType === 'home_delivery'}
											onChange={(e) => setDeliveryType(e.target.value)}
											style={styles.radioInput}
										/>
										<span>Home Delivery (Within India)</span>
									</label>
									<label style={styles.radioLabel}>
										<input
											type="radio"
											name="deliveryType"
											value="store_pickup"
											checked={deliveryType === 'store_pickup'}
											onChange={(e) => setDeliveryType(e.target.value)}
											style={styles.radioInput}
										/>
										<span>Store Pickup</span>
									</label>
								</div>
							</div>

							{/* Delivery Address */}
							<div style={styles.formCard}>
								<h2 style={styles.cardTitle}>Delivery Address</h2>

								<div style={styles.formGrid}>
									<div style={styles.formGroup}>
										<label style={styles.label}>Full Name *</label>
										<input
											type="text"
											name="fullName"
											value={deliveryAddress.fullName}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="Enter your full name"
										/>
									</div>

									<div style={styles.formGroup}>
										<label style={styles.label}>Phone Number *</label>
										<input
											type="tel"
											name="phone"
											value={deliveryAddress.phone}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="10-digit mobile number"
										/>
									</div>

									<div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
										<label style={styles.label}>Email Address *</label>
										<input
											type="email"
											name="email"
											value={deliveryAddress.email}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="your.email@example.com"
										/>
									</div>

									<div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
										<label style={styles.label}>Street Address *</label>
										<input
											type="text"
											name="address"
											value={deliveryAddress.address}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="House No., Building Name, Street"
										/>
									</div>

									<div style={styles.formGroup}>
										<label style={styles.label}>City *</label>
										<input
											type="text"
											name="city"
											value={deliveryAddress.city}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="City"
										/>
									</div>

									<div style={styles.formGroup}>
										<label style={styles.label}>State *</label>
										<input
											type="text"
											name="state"
											value={deliveryAddress.state}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="State"
										/>
									</div>

									<div style={styles.formGroup}>
										<label style={styles.label}>PIN Code *</label>
										<input
											type="text"
											name="zipCode"
											value={deliveryAddress.zipCode}
											onChange={handleAddressChange}
											style={styles.input}
											placeholder="6-digit PIN code"
										/>
									</div>

									<div style={styles.formGroup}>
										<label style={styles.label}>Country</label>
										<input
											type="text"
											name="country"
											value={deliveryAddress.country}
											disabled
											style={{ ...styles.input, backgroundColor: 'var(--surface)' }}
										/>
									</div>
								</div>
							</div>

							{/* Order Notes */}
							<div style={styles.formCard}>
								<h2 style={styles.cardTitle}>Special Instructions (Optional)</h2>
								<textarea
									value={orderNotes}
									onChange={(e) => setOrderNotes(e.target.value)}
									placeholder="e.g., Please deliver on morning, Leave at reception, etc."
									style={styles.textarea}
									rows="4"
								/>
							</div>

							{/* Terms Agreement */}
							<div style={styles.formCard}>
								<label style={styles.checkboxLabel}>
									<input
										type="checkbox"
										checked={agreeTerms}
										onChange={(e) => setAgreeTerms(e.target.checked)}
										style={styles.checkbox}
									/>
									<span>
										I agree to the <a href="#" style={styles.link}>terms and conditions</a> and <a href="#" style={styles.link}>privacy policy</a>
									</span>
								</label>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={isSubmitting}
								style={{
									...styles.submitButton,
									opacity: isSubmitting ? 0.6 : 1,
									cursor: isSubmitting ? 'not-allowed' : 'pointer'
								}}
							>
								{isSubmitting ? 'Processing...' : 'Continue to Payment'}
							</button>
						</form>
					</section>

					{/* Right: Order Summary */}
					<div style={styles.summarySection}>
						<div style={styles.summaryCard}>
							<h2 style={styles.summaryTitle}>Order Summary</h2>

							{/* Items */}
							<div style={styles.itemsList}>
								{cartItems.map(item => (
									<div key={item.medicineId} style={styles.summaryItem}>
										<div>
											<p style={styles.itemName}>{item.name}</p>
											<p style={styles.itemQty}>Qty: {item.quantity}</p>
										</div>
										<p style={styles.itemAmount}>₹{(item.basePrice * item.quantity).toFixed(2)}</p>
									</div>
								))}
							</div>

							<hr style={styles.divider} />

							{/* Pricing */}
							<div style={styles.pricingBreakdown}>
								<div style={styles.pricingRow}>
									<span>Subtotal</span>
									<span>₹{subtotal.toFixed(2)}</span>
								</div>
								{discountPercent > 0 && (
									<div style={{ ...styles.pricingRow, color: 'var(--success)' }}>
										<span>Discount ({discountPercent}%)</span>
										<span>−₹{discount.toFixed(2)}</span>
									</div>
								)}
								{appliedCoupon && (
									<div style={styles.couponBadgeRow}>
										<span style={styles.couponBadge}>{appliedCoupon}</span>
									</div>
								)}
								<div style={styles.pricingRow}>
									<span>Delivery Charge</span>
									<span>{deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge.toFixed(2)}`}</span>
								</div>
								<div style={styles.pricingRow}>
									<span>Tax (5% GST)</span>
									<span>₹{tax.toFixed(2)}</span>
								</div>
								<div style={styles.totalRow}>
									<span>Total</span>
									<span>₹{total.toFixed(2)}</span>
								</div>
							</div>

							{/* Info Cards */}
							<div style={styles.infoBox}>
								<span style={styles.infoIcon}>ℹ️</span>
								<p style={styles.infoText}>
									Check your phone and email for order confirmation and tracking details.
								</p>
							</div>

							<div style={styles.infoBox}>
								<span style={styles.infoIcon}>🔒</span>
								<p style={styles.infoText}>
									Your information is secure and protected with SSL encryption.
								</p>
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
		padding: '3rem 1rem',
		marginTop: '2rem'
	},
	backLink: {
		background: 'none',
		border: 'none',
		color: 'var(--primary)',
		cursor: 'pointer',
		fontSize: '0.95rem',
		fontWeight: '500',
		marginTop: '1rem'
	},
	formSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0'
	},
	formContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem'
	},
	formCard: {
		backgroundColor: 'white',
		padding: '1.5rem',
		borderRadius: 'var(--radius-lg)',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)'
	},
	cardTitle: {
		fontSize: '1.05rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	radioGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	radioLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		cursor: 'pointer',
		fontSize: '0.95rem'
	},
	radioInput: {
		width: '18px',
		height: '18px',
		cursor: 'pointer',
		accentColor: 'var(--primary)'
	},
	formGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem'
	},
	formGroup: {
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
		transition: 'border-color 0.2s',
		outline: 'none'
	},
	textarea: {
		padding: '0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		resize: 'vertical',
		transition: 'border-color 0.2s',
		outline: 'none'
	},
	checkboxLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		cursor: 'pointer',
		fontSize: '0.9rem'
	},
	checkbox: {
		width: '18px',
		height: '18px',
		cursor: 'pointer',
		accentColor: 'var(--primary)'
	},
	link: {
		color: 'var(--primary)',
		textDecoration: 'none',
		fontWeight: '500'
	},
	submitButton: {
		width: '100%',
		padding: '1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius-lg)',
		fontWeight: '600',
		fontSize: '1rem',
		cursor: 'pointer'
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
		fontSize: '1.05rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	itemsList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
		marginBottom: '1rem'
	},
	summaryItem: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		fontSize: '0.85rem'
	},
	itemName: {
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	itemQty: {
		color: 'var(--text-secondary)',
		margin: '0.25rem 0 0 0',
		fontSize: '0.8rem'
	},
	itemAmount: {
		fontWeight: '600',
		color: 'var(--primary)',
		margin: 0
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1rem 0'
	},
	pricingBreakdown: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
		marginBottom: '1rem'
	},
	pricingRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.9rem',
		color: 'var(--text-secondary)'
	},
	couponBadgeRow: {
		padding: '0.75rem',
		backgroundColor: '#DCFCE7',
		borderRadius: 'var(--radius)',
		marginTop: '0.5rem'
	},
	couponBadge: {
		backgroundColor: 'var(--success)',
		color: 'white',
		padding: '0.2rem 0.6rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600'
	},
	totalRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '1.05rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		paddingTop: '0.75rem',
		borderTop: '2px solid var(--primary)',
		marginTop: '0.5rem'
	},
	infoBox: {
		display: 'flex',
		gap: '0.75rem',
		padding: '0.75rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)',
		marginTop: '0.75rem'
	},
	infoIcon: {
		fontSize: '1.2rem',
		flexShrink: 0
	},
	infoText: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0,
		lineHeight: '1.4'
	}
};

export default Checkout;
