import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import styles from './Cart.module.css';

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
					<div className={styles.emptyCart}>
						<div className={styles.emptyCartIcon}>🛒</div>
						<h2 className={styles.emptyCartTitle}>Your Cart is Empty</h2>
						<p className={styles.emptyCartText}>
							Add some medicines to your cart and come back to checkout.
						</p>
						<button 
							onClick={handleContinueShopping}
							className={styles.continueShoppingButton}
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

				<div className={styles.mainContent}>
					{/* Cart Items */}
					<section className="section" style={{ padding: '1.5rem' }}>
						<div className={styles.cartHeader}>
							<p className={styles.itemCount}>
								{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
							</p>
						</div>

						{cartItems.map(item => (
							<div key={item.medicineId} className={styles.cartItem}>
								<div className={styles.itemContent}>
									<div className={styles.itemImage}>
										<span>💊</span>
									</div>

									<div className={styles.itemDetails}>
										<h3 className={styles.itemName}>{item.name}</h3>
										<p className={styles.itemCategory}>{item.category}</p>
										<p className={styles.itemVendor}>Vendor: {item.vendor}</p>
										<p className={styles.itemPrice}>₹{item.basePrice.toFixed(2)} each</p>
									</div>
								</div>

								<div className={styles.itemQuantity}>
									<button
										onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
										className={styles.quantityBtn}
										style={{ backgroundColor: '#FEE2E2' }}
									>
										−
									</button>
									<input
										type="number"
										min="1"
										value={item.quantity}
										onChange={(e) => updateQuantity(item.medicineId, Math.max(1, parseInt(e.target.value) || 1))}
										className={styles.quantityInput}
									/>
									<button
										onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
										className={styles.quantityBtn}
										style={{ backgroundColor: '#DCFCE7' }}
									>
										+
									</button>
								</div>

								<div className={styles.itemTotal}>
									<p className={styles.totalPrice}>₹{(item.basePrice * item.quantity).toFixed(2)}</p>
									<button
										onClick={() => removeFromCart(item.medicineId)}
										className={styles.removeButton}
									>
										🗑️ Remove
									</button>
								</div>
							</div>
						))}
					</section>

					{/* Order Summary */}
					<div className={styles.summarySection}>
						<div className={styles.summaryCard}>
							<h2 className={styles.summaryTitle}>Order Summary</h2>

							{/* Coupon Section */}
							<div className={styles.couponSection}>
								<h3 className={styles.sectionSubtitle}>Apply Coupon</h3>
								{!appliedCoupon ? (
									<div className={styles.couponInput}>
										<input
											type="text"
											placeholder="Enter coupon code"
											value={couponInput}
											onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
											className={styles.couponCodeInput}
										/>
										<button
											onClick={handleApplyCoupon}
											className={styles.applyCouponButton}
										>
											Apply
										</button>
									</div>
								) : (
									<div className={styles.appliedCoupon}>
										<span className={styles.couponBadge}>{appliedCoupon}</span>
										<button
											onClick={handleRemoveCoupon}
											className={styles.removeCouponButton}
										>
											Remove
										</button>
									</div>
								)}
								<p className={styles.couponHint}>Try: SAVE10, SAVE20, MEDHEALTH, BULK25</p>
							</div>

							<hr className={styles.divider} />

							{/* Price Breakdown */}
							<div className={styles.priceBreakdown}>
								<div className={styles.priceRow}>
									<span>Subtotal</span>
									<span>₹{subtotal.toFixed(2)}</span>
								</div>
								{buyerMargin > 0 && (
									<div className={styles.priceRow} style={{ color: 'var(--success)' }}>
										<span>Buyer Margin</span>
										<span>−₹{buyerMargin.toFixed(2)}</span>
									</div>
								)}
								<div className={styles.priceRow}>
									<span>Platform Charges</span>
									<span>₹{platformCharge.toFixed(2)}</span>
								</div>
								{discountPercent > 0 && (
									<div className={styles.priceRow} style={{ color: 'var(--success)' }}>
										<span>Discount ({discountPercent}%)</span>
										<span>−₹{discount.toFixed(2)}</span>
									</div>
								)}
								<div className={styles.priceRow}>
									<span>Tax (5% GST)</span>
									<span>₹{tax.toFixed(2)}</span>
								</div>
								<div className={styles.totalRow}>
									<span>Total Amount</span>
									<span>₹{total.toFixed(2)}</span>
								</div>
							</div>

							<button 
								onClick={handleCheckout}
								className={styles.checkoutButton}
							>
								Proceed to Checkout
							</button>

							<button 
								onClick={handleContinueShopping}
								className={styles.continueButton}
							>
								Continue Shopping
							</button>
						</div>

						{/* Information Cards */}
						<div className={styles.infoCard}>
							<div className={styles.infoCardContent}>
								<span className={styles.infoIcon}>🚚</span>
								<div>
									<h4 className={styles.infoCardTitle}>Free Delivery</h4>
									<p className={styles.infoCardText}>On orders above ₹500</p>
								</div>
							</div>
						</div>

						<div className={styles.infoCard}>
							<div className={styles.infoCardContent}>
								<span className={styles.infoIcon}>✓</span>
								<div>
									<h4 className={styles.infoCardTitle}>Verified Medicines</h4>
									<p className={styles.infoCardText}>All medicines are certified</p>
								</div>
							</div>
						</div>

						<div className={styles.infoCard}>
							<div className={styles.infoCardContent}>
								<span className={styles.infoIcon}>🔒</span>
								<div>
									<h4 className={styles.infoCardTitle}>Secure Checkout</h4>
									<p className={styles.infoCardText}>Safe & encrypted payment</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}

export default Cart;
