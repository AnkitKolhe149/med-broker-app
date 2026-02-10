import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';

function Cart() {
	const navigate = useNavigate();
	const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
	const { showError, showSuccess } = useNotification();
	const [appliedCoupon, setAppliedCoupon] = useState('');
	const [couponInput, setCouponInput] = useState('');
	const [discountPercent, setDiscountPercent] = useState(0);

	// Sample coupons for demo
	const validCoupons = {
		'SAVE10': 10,
		'SAVE20': 20,
		'MEDHEALTH': 15,
		'BULK25': 25
	};

	const subtotal = getTotalPrice();
	const retailSubtotal = cartItems.reduce((total, item) => total + (item.retailPrice * item.quantity), 0);
	const buyerMargin = Math.max(0, retailSubtotal - subtotal);
	const platformCharge = subtotal * 0.02; // Placeholder until backend pricing engine
	const discount = (subtotal * discountPercent) / 100;
	const tax = (subtotal - discount + platformCharge) * 0.05; // 5% GST
	const total = subtotal - discount + platformCharge + tax;

	const handleApplyCoupon = () => {
		const coupon = couponInput.toUpperCase();
		if (validCoupons[coupon]) {
			setAppliedCoupon(coupon);
			setDiscountPercent(validCoupons[coupon]);
			showSuccess(`Coupon ${coupon} applied successfully`);
		} else {
			showError('Invalid coupon code');
			setCouponInput('');
		}
	};

	const handleRemoveCoupon = () => {
		setAppliedCoupon('');
		setDiscountPercent(0);
		setCouponInput('');
	};

	const handleCheckout = () => {
		if (cartItems.length === 0) {
			showError('Your cart is empty');
			return;
		}
		navigate('/customer/checkout', { state: { discountPercent, appliedCoupon } });
	};

	const handleContinueShopping = () => {
		navigate('/customer/catalog');
	};

	if (cartItems.length === 0) {
		return (
			<main className="page">
				<div className="container">
					<div style={styles.emptyCart}>
						<div style={styles.emptyCartIcon}>🛒</div>
						<h2 style={styles.emptyCartTitle}>Your Cart is Empty</h2>
						<p style={styles.emptyCartText}>
							Add some medicines to your cart and come back to checkout.
						</p>
						<button 
							onClick={handleContinueShopping}
							style={styles.continueShoppingButton}
						>
							Browse Medicines
						</button>
					</div>
				</div>
			</main>
		);
	}

	return (
		<main className="page">
			<div className="container">
				<div className="page-header">
					<div className="title-group">
						<h1 className="section-title">Shopping Cart</h1>
						<p className="section-subtitle">Review items and proceed to checkout</p>
					</div>
				</div>

				<div style={styles.mainContent}>
					{/* Cart Items */}
					<section className="section" style={{ padding: '1.5rem' }}>
						<div style={styles.cartHeader}>
							<p style={styles.itemCount}>
								{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
							</p>
						</div>

						{cartItems.map(item => (
							<div key={item.medicineId} style={styles.cartItem}>
								<div style={styles.itemContent}>
									<div style={styles.itemImage}>
										<span>💊</span>
									</div>

									<div style={styles.itemDetails}>
										<h3 style={styles.itemName}>{item.name}</h3>
										<p style={styles.itemCategory}>{item.category}</p>
										<p style={styles.itemVendor}>Vendor: {item.vendor}</p>
										<p style={styles.itemPrice}>₹{item.basePrice.toFixed(2)} each</p>
									</div>
								</div>

								<div style={styles.itemQuantity}>
									<button
										onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
										style={{ ...styles.quantityBtn, backgroundColor: '#FEE2E2' }}
									>
										−
									</button>
									<input
										type="number"
										min="1"
										value={item.quantity}
										onChange={(e) => updateQuantity(item.medicineId, Math.max(1, parseInt(e.target.value) || 1))}
										style={styles.quantityInput}
									/>
									<button
										onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
										style={{ ...styles.quantityBtn, backgroundColor: '#DCFCE7' }}
									>
										+
									</button>
								</div>

								<div style={styles.itemTotal}>
									<p style={styles.totalPrice}>₹{(item.basePrice * item.quantity).toFixed(2)}</p>
									<button
										onClick={() => removeFromCart(item.medicineId)}
										style={styles.removeButton}
									>
										🗑️ Remove
									</button>
								</div>
							</div>
						))}
					</section>

					{/* Order Summary */}
					<div style={styles.summarySection}>
						<div style={styles.summaryCard}>
							<h2 style={styles.summaryTitle}>Order Summary</h2>

							{/* Coupon Section */}
							<div style={styles.couponSection}>
								<h3 style={styles.sectionSubtitle}>Apply Coupon</h3>
								{!appliedCoupon ? (
									<div style={styles.couponInput}>
										<input
											type="text"
											placeholder="Enter coupon code"
											value={couponInput}
											onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
											style={styles.couponCodeInput}
										/>
										<button
											onClick={handleApplyCoupon}
											style={styles.applyCouponButton}
										>
											Apply
										</button>
									</div>
								) : (
									<div style={styles.appliedCoupon}>
										<span style={styles.couponBadge}>{appliedCoupon}</span>
										<button
											onClick={handleRemoveCoupon}
											style={styles.removeCouponButton}
										>
											Remove
										</button>
									</div>
								)}
								<p style={styles.couponHint}>Try: SAVE10, SAVE20, MEDHEALTH, BULK25</p>
							</div>

							<hr style={styles.divider} />

							{/* Price Breakdown */}
							<div style={styles.priceBreakdown}>
								<div style={styles.priceRow}>
									<span>Subtotal</span>
									<span>₹{subtotal.toFixed(2)}</span>
								</div>
								{buyerMargin > 0 && (
									<div style={{ ...styles.priceRow, color: 'var(--success)' }}>
										<span>Buyer Margin</span>
										<span>−₹{buyerMargin.toFixed(2)}</span>
									</div>
								)}
								<div style={styles.priceRow}>
									<span>Platform Charges</span>
									<span>₹{platformCharge.toFixed(2)}</span>
								</div>
								{discountPercent > 0 && (
									<div style={{ ...styles.priceRow, color: 'var(--success)' }}>
										<span>Discount ({discountPercent}%)</span>
										<span>−₹{discount.toFixed(2)}</span>
									</div>
								)}
								<div style={styles.priceRow}>
									<span>Tax (5% GST)</span>
									<span>₹{tax.toFixed(2)}</span>
								</div>
								<div style={styles.totalRow}>
									<span>Total Amount</span>
									<span>₹{total.toFixed(2)}</span>
								</div>
							</div>

							<button 
								onClick={handleCheckout}
								style={styles.checkoutButton}
							>
								Proceed to Checkout
							</button>

							<button 
								onClick={handleContinueShopping}
								style={styles.continueButton}
							>
								Continue Shopping
							</button>
						</div>

						{/* Information Cards */}
						<div style={styles.infoCard}>
							<div style={styles.infoCardContent}>
								<span style={styles.infoIcon}>🚚</span>
								<div>
									<h4 style={styles.infoCardTitle}>Free Delivery</h4>
									<p style={styles.infoCardText}>On orders above ₹500</p>
								</div>
							</div>
						</div>

						<div style={styles.infoCard}>
							<div style={styles.infoCardContent}>
								<span style={styles.infoIcon}>✓</span>
								<div>
									<h4 style={styles.infoCardTitle}>Verified Medicines</h4>
									<p style={styles.infoCardText}>All medicines are certified</p>
								</div>
							</div>
						</div>

						<div style={styles.infoCard}>
							<div style={styles.infoCardContent}>
								<span style={styles.infoIcon}>🔒</span>
								<div>
									<h4 style={styles.infoCardTitle}>Secure Checkout</h4>
									<p style={styles.infoCardText}>Safe & encrypted payment</p>
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
		gridTemplateColumns: '2fr 1.2fr',
		gap: '2rem',
		marginTop: '2rem'
	},
	emptyCart: {
		textAlign: 'center',
		padding: '3rem 1rem',
		marginTop: '2rem'
	},
	emptyCartIcon: {
		fontSize: '4rem',
		marginBottom: '1rem'
	},
	emptyCartTitle: {
		fontSize: '1.5rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		marginBottom: '0.5rem'
	},
	emptyCartText: {
		color: 'var(--text-secondary)',
		marginBottom: '2rem'
	},
	continueShoppingButton: {
		backgroundColor: 'var(--primary)',
		color: 'white',
		padding: '0.75rem 2rem',
		borderRadius: 'var(--radius)',
		border: 'none',
		cursor: 'pointer',
		fontWeight: '600'
	},
	cartItemsSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	cartHeader: {
		padding: '1rem',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		marginBottom: '0.5rem'
	},
	itemCount: {
		margin: 0,
		fontWeight: '600',
		color: 'var(--text-primary)'
	},
	cartItem: {
		display: 'grid',
		gridTemplateColumns: '1fr auto auto auto',
		gap: '1.5rem',
		alignItems: 'center',
		padding: '1rem',
		backgroundColor: 'white',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		boxShadow: 'var(--shadow-sm)'
	},
	itemContent: {
		display: 'flex',
		gap: '1rem'
	},
	itemImage: {
		width: '60px',
		height: '60px',
		backgroundColor: 'var(--primary-light)',
		borderRadius: 'var(--radius)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '2rem',
		flexShrink: 0
	},
	itemDetails: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.25rem'
	},
	itemName: {
		fontSize: '0.95rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: 0
	},
	itemCategory: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	itemVendor: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		margin: 0
	},
	itemPrice: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--primary)',
		margin: '0.25rem 0 0 0'
	},
	itemQuantity: {
		display: 'flex',
		gap: '0.25rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--border)'
	},
	quantityBtn: {
		width: '32px',
		height: '32px',
		border: 'none',
		background: 'none',
		cursor: 'pointer',
		fontWeight: '600',
		borderRadius: '0',
		transition: 'background-color 0.2s'
	},
	quantityInput: {
		width: '50px',
		border: 'none',
		textAlign: 'center',
		fontWeight: '600',
		padding: '0'
	},
	itemTotal: {
		textAlign: 'right',
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	totalPrice: {
		fontSize: '1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: 0
	},
	removeButton: {
		background: 'none',
		border: '1px solid var(--border)',
		padding: '0.4rem 0.6rem',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		transition: 'all 0.2s'
	},
	summarySection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
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
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		margin: '0 0 1rem 0',
		paddingBottom: '0.75rem',
		borderBottom: '2px solid var(--primary)'
	},
	couponSection: {
		marginBottom: '1rem'
	},
	sectionSubtitle: {
		fontSize: '0.9rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0 0 0.75rem 0'
	},
	couponInput: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '0.5rem'
	},
	couponCodeInput: {
		flex: 1,
		padding: '0.5rem 0.75rem',
		border: '1px solid var(--border)',
		borderRadius: 'var(--radius)',
		fontSize: '0.85rem'
	},
	applyCouponButton: {
		padding: '0.5rem 1rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		cursor: 'pointer',
		fontWeight: '600',
		fontSize: '0.85rem'
	},
	appliedCoupon: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.75rem',
		backgroundColor: '#DCFCE7',
		borderRadius: 'var(--radius)',
		border: '1px solid #BBFDE0'
	},
	couponBadge: {
		backgroundColor: 'var(--success)',
		color: 'white',
		padding: '0.25rem 0.75rem',
		borderRadius: 'var(--radius)',
		fontSize: '0.8rem',
		fontWeight: '600'
	},
	removeCouponButton: {
		marginLeft: 'auto',
		background: 'none',
		border: 'none',
		color: 'var(--error)',
		cursor: 'pointer',
		fontWeight: '600',
		padding: '0'
	},
	couponHint: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: '0.5rem 0 0 0'
	},
	divider: {
		border: 'none',
		borderTop: '1px solid var(--border)',
		margin: '1rem 0'
	},
	priceBreakdown: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
		marginBottom: '1rem'
	},
	priceRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.9rem',
		color: 'var(--text-secondary)'
	},
	totalRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '1.1rem',
		fontWeight: '700',
		color: 'var(--text-primary)',
		paddingTop: '0.75rem',
		borderTop: '2px solid var(--primary)',
		marginTop: '0.5rem'
	},
	checkoutButton: {
		width: '100%',
		padding: '0.75rem',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer',
		marginBottom: '0.5rem'
	},
	continueButton: {
		width: '100%',
		padding: '0.75rem',
		backgroundColor: 'transparent',
		color: 'var(--primary)',
		border: '1px solid var(--primary)',
		borderRadius: 'var(--radius)',
		fontWeight: '600',
		cursor: 'pointer'
	},
	infoCard: {
		backgroundColor: 'var(--primary-light)',
		padding: '1rem',
		borderRadius: 'var(--radius)',
		border: '1px solid var(--green-200)'
	},
	infoCardContent: {
		display: 'flex',
		gap: '0.75rem',
		alignItems: 'flex-start'
	},
	infoIcon: {
		fontSize: '1.5rem',
		flexShrink: 0
	},
	infoCardTitle: {
		fontSize: '0.85rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		margin: '0 0 0.25rem 0'
	},
	infoCardText: {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: 0
	}
};

export default Cart;
