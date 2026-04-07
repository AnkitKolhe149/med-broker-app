import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import styles from './Cart.module.css';

function Cart() {
	const navigate = useNavigate();
	const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();
	const { showError, showSuccess } = useNotification();
	const [appliedCoupon, setAppliedCoupon] = useState('');
	const [couponInput, setCouponInput] = useState('');
	const [orderNotes, setOrderNotes] = useState('');
	const [discountPercent, setDiscountPercent] = useState(0);
	const cartCurrency = cartItems[0]?.currencyCode || localStorage.getItem('preferredCurrency') || 'USD';
	const formatPrice = (value) => formatCurrency(value, cartCurrency, true);

	// Sample coupons for demo
	const validCoupons = {
		'SAVE10': 10,
		'SAVE20': 20,
		'MEDHEALTH': 15,
		'BULK25': 25
	};

	const subtotal = getTotalPrice();
	const deliveryFee = cartItems.length > 0 ? 10 : 0;
	const discount = (subtotal * discountPercent) / 100;
	const total = subtotal - discount + deliveryFee;

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
		navigate('/customer/checkout', { state: { discountPercent, appliedCoupon, currencyCode: cartCurrency } });
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
				<h1 className={styles.pageTitle}>Cart ({cartItems.length})</h1>

				<div className={styles.mainContent}>
					<section className={styles.cartColumn}>
						<div className={styles.itemsPanel}>
							{cartItems.map(item => (
								<article key={item.medicineId} className={styles.cartItem}>
									<div className={styles.itemImage}>
										{item.imageUrl ? (
											<img src={item.imageUrl} alt={item.name} className={styles.itemImageMedia} loading="lazy" />
										) : (
											<span>{(item.name || 'M').charAt(0).toUpperCase()}</span>
										)}
									</div>

									<div className={styles.itemBody}>
										<p className={styles.itemType}>● {item.category || 'Medicine'}</p>
										<h3 className={styles.itemName}>{item.name}</h3>
										<p className={styles.itemSubline}>{item.vendor || 'Trusted pharmacy partner'}</p>
										<p className={styles.itemPrice}>{formatPrice(item.basePrice)}</p>
									</div>

									<div className={styles.itemActions}>
										<div className={styles.itemQuantity}>
											<button
												onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
												className={styles.quantityBtn}
												aria-label={`Decrease quantity for ${item.name}`}
											>
												{'<'}
											</button>
											<span className={styles.quantityValue}>{item.quantity}</span>
											<button
												onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
												className={styles.quantityBtn}
												aria-label={`Increase quantity for ${item.name}`}
											>
												{'>'}
											</button>
										</div>

										<button
											onClick={() => removeFromCart(item.medicineId)}
											className={styles.removeButton}
										>
											Remove
										</button>
									</div>
								</article>
							))}
						</div>

						<div className={styles.bottomInputs}>
							<div className={styles.inputCard}>
								<h3>Add request / notes with order</h3>
								<textarea
									value={orderNotes}
									onChange={(e) => setOrderNotes(e.target.value)}
									placeholder="Write any product issue / special request from pharmacy"
									className={styles.notesInput}
								/>
							</div>

							<div className={styles.inputCard}>
								<h3>Upload a Prescription Image</h3>
								<div className={styles.uploadCard}>
									<p>Prescription upload happens during checkout and is required before payment.</p>
									<p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>
										Continue to checkout to upload the file securely.
									</p>
								</div>
							</div>
						</div>
					</section>

					<aside className={styles.summarySection}>
						<div className={styles.summaryCard}>
							<h2 className={styles.summaryTitle}>Order Summary</h2>

							<div className={styles.promoRow}>
								<p>Have a promo Code?</p>
								<div className={styles.couponInput}>
									<input
										type="text"
										placeholder="Promo code"
										value={couponInput}
										onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
										className={styles.couponCodeInput}
									/>
									<button onClick={handleApplyCoupon} className={styles.applyCouponButton}>Add</button>
								</div>
								{appliedCoupon && (
									<div className={styles.appliedCoupon}>
										<span className={styles.couponBadge}>{appliedCoupon} ({discountPercent}% off)</span>
										<button onClick={handleRemoveCoupon} className={styles.removeCouponButton}>Remove</button>
									</div>
								)}
							</div>

							<div className={styles.priceBreakdown}>
								<div className={styles.priceRow}>
									<span>Sub-Total</span>
									<span>{formatPrice(subtotal)}</span>
								</div>
								<div className={styles.priceRow}>
									<span>Delivery Fees</span>
									<span>{formatPrice(deliveryFee)}</span>
								</div>
								{discountPercent > 0 && (
									<div className={styles.priceRow}>
										<span>Promo Discount</span>
										<span>-{formatPrice(discount)}</span>
									</div>
								)}
								<div className={styles.totalRow}>
									<span>Total</span>
									<span>{formatPrice(total)}</span>
								</div>
							</div>

							<button onClick={handleCheckout} className={styles.checkoutButton}>Proceed To Checkout</button>
							<button onClick={handleContinueShopping} className={styles.continueButton}>Continue Shopping</button>
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}

export default Cart;
