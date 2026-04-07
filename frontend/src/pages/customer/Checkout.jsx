import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';

function Checkout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cartItems, getTotalPrice } = useCart();
	const { currency, convert } = useCurrency();
	const { user, loading: userLoading } = useUser();
	const { showError } = useNotification();
	const { width } = useResponsive();

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
	const [prescriptionFile, setPrescriptionFile] = useState(null);
	const [prescriptionUrl, setPrescriptionUrl] = useState('');
	const [prescriptionName, setPrescriptionName] = useState('');
	const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const discountPercent = location.state?.discountPercent || 0;
	const appliedCoupon = location.state?.appliedCoupon || '';
	const currencyCode = location.state?.currencyCode || cartItems[0]?.currencyCode || currency || 'USD';
	const formatPrice = (value) => formatCurrency(value, currencyCode, true);
	const toDisplayAmount = (value) => convert(value, 'INR');

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
		setDeliveryAddress(prev => {
			const updates = { [name]: value };
			
			// Auto capture 6-digit PIN code anywhere in the address
			if (name === 'address') {
				const pinMatch = value.match(/\b\d{6}\b/);
				// Update ONLY if a zipCode isn't currently manually typed OR if it's empty
				if (pinMatch && (!prev.zipCode || prev.zipCode === pinMatch[0] || prev.zipCode.length < 6)) {
					updates.zipCode = pinMatch[0];
				}
			}

			return { ...prev, ...updates };
		});
	};

	const handlePrescriptionChange = async (e) => {
		const file = e.target.files?.[0] || null;
		setPrescriptionFile(file);
		setPrescriptionUrl('');
		setPrescriptionName('');

		if (!file) {
			return;
		}

		setIsUploadingPrescription(true);
		try {
			const result = await orderService.uploadPrescription(file);
			setPrescriptionUrl(result.prescriptionUrl);
			setPrescriptionName(file.name);
		} catch (error) {
			console.error('Failed to upload prescription:', error);
			showError(error.message || 'Failed to upload prescription image');
			setPrescriptionFile(null);
			setPrescriptionUrl('');
			setPrescriptionName('');
			e.target.value = '';
		} finally {
			setIsUploadingPrescription(false);
		}
	};

	const indianStates = [
		"Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
		"Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
		"Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
		"Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
		"Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
		"Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
		"Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
	];

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
		if (!prescriptionUrl) {
			showError('Please upload your prescription image before continuing');
			return false;
		}
		if (isUploadingPrescription) {
			showError('Please wait for the prescription upload to finish');
			return false;
		}

		for (const item of cartItems) {
			const packageType = String(item.selectedSize || item.packageType || 'standard').toLowerCase();
			const bulkMinQty = Math.max(1, Number.parseInt(item.bulkMinQty, 10) || 1);
			if (packageType === 'bulk' && Number(item.quantity) < bulkMinQty) {
				showError(`${item.name || 'Bulk item'} requires at least ${bulkMinQty} units`);
				return false;
			}
		}
		return true;
	};

	const handlePlaceOrder = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			const createdOrder = await orderService.createCustomerOrder({
				items: cartItems.map((item) => ({
					medicineId: item.medicineId,
					quantity: item.quantity,
					selectedSize: item.selectedSize || 'standard'
				}))
			});

			const orderData = {
				orderId: createdOrder.id,
				cartItems,
				deliveryAddress,
				deliveryType,
				orderNotes,
				prescriptionUrl,
				prescriptionName,
				discountPercent,
				appliedCoupon,
				subtotalBase: createdOrder.totalCents ? createdOrder.totalCents / 100 : getTotalPrice(),
				subtotal: createdOrder.totalCents ? toDisplayAmount(createdOrder.totalCents / 100) : getTotalPrice(),
				currencyCode,
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

				<div style={{
					...styles.mainContent,
					gridTemplateColumns: width >= 1024 ? '2fr 1fr' : '1fr',
					gap: width < 768 ? '1.5rem' : '2rem'
				}}>
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

							<div style={{
								...styles.formGrid,
								gridTemplateColumns: width >= 768 ? '1fr 1fr' : '1fr'
							}}>
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
										<select
											name="state"
											value={deliveryAddress.state}
											onChange={handleAddressChange}
											style={{ ...styles.input, backgroundColor: 'white' }}
										>
											<option value="">Select a State</option>
											{indianStates.map(stateName => (
												<option key={stateName} value={stateName}>{stateName}</option>
											))}
										</select>
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
								<h2 style={styles.cardTitle}>Prescription Upload *</h2>
								<p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
									Upload a clear image of your doctor's prescription. The file is uploaded to Cloudinary before you continue.
								</p>
								<div style={styles.uploadZone}>
									<input
										type="file"
										accept="image/*"
										onChange={handlePrescriptionChange}
										style={styles.fileInput}
									/>
									<p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
										{isUploadingPrescription ? 'Uploading prescription...' : prescriptionName ? `Uploaded: ${prescriptionName}` : 'No prescription uploaded yet'}
									</p>
									{prescriptionUrl && (
										<p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--success)' }}>
											✓ Prescription stored in Cloudinary
										</p>
									)}
								</div>
							</div>

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
										<p style={styles.itemAmount}>{formatPrice(item.basePrice * item.quantity)}</p>
									</div>
								))}
							</div>

							<hr style={styles.divider} />

							{/* Pricing */}
							<div style={styles.pricingBreakdown}>
								<div style={styles.pricingRow}>
									<span>Subtotal</span>
									<span>{formatPrice(subtotal)}</span>
								</div>
								{discountPercent > 0 && (
									<div style={{ ...styles.pricingRow, color: 'var(--success)' }}>
										<span>Discount ({discountPercent}%)</span>
										<span>−{formatPrice(discount)}</span>
									</div>
								)}
								{appliedCoupon && (
									<div style={styles.couponBadgeRow}>
										<span style={styles.couponBadge}>{appliedCoupon}</span>
									</div>
								)}
								<div style={styles.pricingRow}>
									<span>Delivery Charge</span>
									<span>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span>
								</div>
								<div style={styles.pricingRow}>
									<span>Tax (5% GST)</span>
									<span>{formatPrice(tax)}</span>
								</div>
								<div style={styles.totalRow}>
									<span>Total</span>
									<span>{formatPrice(total)}</span>
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
		marginTop: '2rem'
		// gridTemplateColumns handled dynamically above
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
		marginTop: '1rem',
		padding: '10px 0',
		minHeight: '44px',
		display: 'flex',
		alignItems: 'center',
		transition: 'all 0.2s ease'
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
		gap: '1rem'
		// gridTemplateColumns handled dynamically above
	},
	formGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	uploadZone: {
		border: '1px dashed #c8d5de',
		borderRadius: '10px',
		padding: '1rem',
		backgroundColor: '#fbfdfe'
	},
	fileInput: {
		display: 'block',
		width: '100%',
		padding: '0.55rem',
		border: '1px solid #d7e1e8',
		borderRadius: '8px',
		backgroundColor: '#ffffff'
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
		fontSize: '0.95rem',
		fontFamily: 'inherit',
		transition: 'border-color 0.2s',
		outline: 'none',
		minHeight: '44px'
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
		padding: '12px 16px',
		backgroundColor: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: 'var(--radius-lg)',
		fontWeight: '600',
		fontSize: '1rem',
		cursor: 'pointer',
		minHeight: '44px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		transition: 'all 0.2s ease'
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
