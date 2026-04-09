import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircleHelp, Lock, Mail, Phone, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './Checkout.module.css';

function Checkout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cartItems, getTotalPrice } = useCart();
	const { currency } = useCurrency();
	const { user, loading: userLoading } = useUser();
	const { showError } = useNotification();

	const [deliveryType, setDeliveryType] = useState('standard');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [couponInput, setCouponInput] = useState('');
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

	const indianStates = useMemo(() => [
		'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
		'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
		'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
		'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
		'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
		'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
		'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
	], []);

	useEffect(() => {
		if (!user?.customer) return;

		const fullName = user.customer.fullName || '';
		const parts = fullName.trim().split(/\s+/).filter(Boolean);
		const initialFirst = parts[0] || '';
		const initialLast = parts.slice(1).join(' ');

		setFirstName(initialFirst);
		setLastName(initialLast);
		setDeliveryAddress((prev) => ({
			...prev,
			fullName,
			phone: user.customer.phoneNumber || '',
			email: user.email || '',
			address: user.customer.address || '',
			city: user.customer.city || '',
			state: user.customer.state || '',
			zipCode: user.customer.zipCode || '',
			country: 'India'
		}));
	}, [user]);

	const handleNameChange = (key, value) => {
		if (key === 'first') {
			setFirstName(value);
			setDeliveryAddress((prev) => ({ ...prev, fullName: `${value} ${lastName}`.trim() }));
			return;
		}
		setLastName(value);
		setDeliveryAddress((prev) => ({ ...prev, fullName: `${firstName} ${value}`.trim() }));
	};

	const handleAddressChange = (event) => {
		const { name, value } = event.target;
		setDeliveryAddress((prev) => {
			const updates = { [name]: value };

			if (name === 'address') {
				const pinMatch = value.match(/\b\d{6}\b/);
				if (pinMatch && (!prev.zipCode || prev.zipCode === pinMatch[0] || prev.zipCode.length < 6)) {
					updates.zipCode = pinMatch[0];
				}
			}

			return { ...prev, ...updates };
		});
	};

	const handlePrescriptionChange = async (event) => {
		const file = event.target.files?.[0] || null;
		setPrescriptionFile(file);
		setPrescriptionUrl('');
		setPrescriptionName('');

		if (!file) return;

		setIsUploadingPrescription(true);
		try {
			const result = await orderService.uploadPrescription(file);
			setPrescriptionUrl(result.prescriptionUrl);
			setPrescriptionName(file.name);
		} catch (error) {
			console.error('Failed to upload prescription:', error);
			showError(error.message || 'Failed to upload prescription image');
			setPrescriptionFile(null);
			event.target.value = '';
		} finally {
			setIsUploadingPrescription(false);
		}
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
		if (!deliveryAddress.email.trim()) {
			showError('Please enter your email');
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
		if (!deliveryAddress.state.trim()) {
			showError('Please select your state');
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

	const handlePlaceOrder = async (event) => {
		event.preventDefault();
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			const createdOrder = await orderService.createCustomerOrder({
				items: cartItems.map((item) => ({
					medicineId: item.medicineId,
					vendorId: item.vendorId,
					quantity: item.quantity,
					selectedSize: item.selectedSize || 'standard'
				})),
				deliveryType,
				deliveryAddress,
				orderNotes,
				prescriptionUrl,
				prescriptionName,
				discountPercent,
				appliedCoupon,
				currencyCode,
				checkoutSnapshot: {
					cartItems,
					deliveryAddress,
					deliveryType,
					orderNotes,
					prescriptionUrl,
					prescriptionName,
					discountPercent,
					appliedCoupon,
					currencyCode,
					subtotal,
					discount,
					deliveryCharge,
					tax,
					total,
					pricingSummary: {
						subtotalCents: Math.round(subtotal * 100),
						discountCents: Math.round(discount * 100),
						deliveryChargeCents: Math.round(deliveryCharge * 100),
						taxCents: Math.round(tax * 100),
						totalCents: Math.round(total * 100)
					}
				}
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
				subtotalBase: subtotal,
				subtotal,
				discountBase: discount,
				discount,
				deliveryBase: deliveryCharge,
				deliveryCharge,
				taxBase: tax,
				tax,
				totalBase: total,
				total,
				currencyCode,
				timestamp: new Date().toISOString()
			};

			sessionStorage.setItem('pending_order', JSON.stringify(orderData));
			navigate(`/customer/payment?orderId=${createdOrder.id}`);
		} catch (error) {
			console.error('Failed to place order:', error);
			const apiMessage = error?.response?.data?.message || error?.message;
			showError(apiMessage || 'Failed to place order. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (userLoading) {
		return (
			<div className={styles.loaderWrap}>
				<p>Loading checkout...</p>
			</div>
		);
	}

	if (cartItems.length === 0) {
		return (
			<main className="page">
				<div className="container">
					<div className={styles.emptyState}>
						<p>Your cart is empty. Please add items before checkout.</p>
						<button onClick={() => navigate('/customer/catalog')} className={styles.backLink}>
							Back to Catalog
						</button>
					</div>
				</div>
			</main>
		);
	}

	const subtotal = getTotalPrice();
	const discount = (subtotal * discountPercent) / 100;
	const deliveryCharge = deliveryType === 'express' ? 9 : 0;
	const tax = Number(((subtotal - discount + deliveryCharge) * 0.05).toFixed(2));
	const total = Number((subtotal - discount + deliveryCharge + tax).toFixed(2));

	return (
		<main className={`page ${styles.checkoutPage}`}>
			<div className={`container ${styles.checkoutContainer}`}>
				<div className={styles.breadcrumbRow}>
					<button type="button" className={styles.breadcrumbLink} onClick={() => navigate('/customer/cart')}>Cart</button>
					<span>›</span>
					<span className={styles.breadcrumbActive}>Shipping</span>
					<span>›</span>
					<span>Payment</span>
				</div>

				<div className={styles.layoutGrid}>
					<section className={styles.formPanel}>
						<h1 className={styles.panelTitle}>Shipping Address</h1>

						<form id="checkout-form" className={styles.checkoutForm} onSubmit={handlePlaceOrder}>
							<div className={styles.formGrid}>
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>First Name*</label>
									<input className={styles.fieldInput} value={firstName} onChange={(e) => handleNameChange('first', e.target.value)} placeholder="First name" />
								</div>
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>Last Name*</label>
									<input className={styles.fieldInput} value={lastName} onChange={(e) => handleNameChange('last', e.target.value)} placeholder="Last name" />
								</div>

								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>Email*</label>
									<input type="email" name="email" className={styles.fieldInput} value={deliveryAddress.email} onChange={handleAddressChange} placeholder="you@example.com" />
								</div>
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>Phone Number*</label>
									<input type="tel" name="phone" className={styles.fieldInput} value={deliveryAddress.phone} onChange={handleAddressChange} placeholder="10-digit phone" />
								</div>

								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>City*</label>
									<input name="city" className={styles.fieldInput} value={deliveryAddress.city} onChange={handleAddressChange} placeholder="City" />
								</div>
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>State*</label>
									<select name="state" className={styles.fieldInput} value={deliveryAddress.state} onChange={handleAddressChange}>
										<option value="">Select state</option>
										{indianStates.map((stateName) => (
											<option key={stateName} value={stateName}>{stateName}</option>
										))}
									</select>
								</div>

								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>Zip Code*</label>
									<input name="zipCode" className={styles.fieldInput} value={deliveryAddress.zipCode} onChange={handleAddressChange} placeholder="PIN / ZIP" />
								</div>
								<div className={styles.fieldGroup}>
									<label className={styles.fieldLabel}>Country</label>
									<input name="country" className={styles.fieldInput} value={deliveryAddress.country} onChange={handleAddressChange} disabled />
								</div>

								<div className={`${styles.fieldGroup} ${styles.fullRow}`}>
									<label className={styles.fieldLabel}>Description*</label>
									<textarea name="address" className={styles.fieldTextarea} value={deliveryAddress.address} onChange={handleAddressChange} placeholder="Enter full address" rows={4} />
								</div>
							</div>

							<div className={styles.uploadBlock}>
								<label className={styles.fieldLabel}>Prescription Upload (Optional)</label>
								<input type="file" accept="image/*" className={styles.fileInput} onChange={handlePrescriptionChange} />
								<p className={styles.fileStatus}>
									{isUploadingPrescription ? 'Uploading prescription...' : prescriptionName ? `Uploaded: ${prescriptionName}` : 'No file selected'}
								</p>
								{prescriptionFile && !prescriptionName && !isUploadingPrescription ? (
									<p className={styles.fileHint}>Selected: {prescriptionFile.name}</p>
								) : null}
							</div>

							<div className={styles.shippingBlock}>
								<h2 className={styles.shippingTitle}>Shipping Method</h2>
								<div className={styles.shippingMethods}>
									<label className={`${styles.shippingCard} ${deliveryType === 'standard' ? styles.shippingCardActive : ''}`}>
										<input type="radio" name="deliveryType" value="standard" checked={deliveryType === 'standard'} onChange={(e) => setDeliveryType(e.target.value)} />
										<div>
											<p className={styles.shippingLabel}>Free Shipping</p>
											<p className={styles.shippingEta}>5-7 Days</p>
										</div>
										<strong>{formatPrice(0)}</strong>
									</label>
									<label className={`${styles.shippingCard} ${deliveryType === 'express' ? styles.shippingCardActive : ''}`}>
										<input type="radio" name="deliveryType" value="express" checked={deliveryType === 'express'} onChange={(e) => setDeliveryType(e.target.value)} />
										<div>
											<p className={styles.shippingLabel}>Express Shipping</p>
											<p className={styles.shippingEta}>1-3 Days</p>
										</div>
										<strong>{formatPrice(9)}</strong>
									</label>
								</div>
							</div>

							<div className={styles.termsRow}>
								<input id="checkout-terms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
								<label htmlFor="checkout-terms">I agree to the terms and conditions and privacy policy.</label>
							</div>

							<textarea className={styles.noteArea} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Special delivery note (optional)" rows={3} />
						</form>
					</section>

					<aside className={styles.summaryPanel}>
						<h2 className={styles.summaryTitle}>Your Cart</h2>

						<div className={styles.summaryItems}>
							{cartItems.map((item) => (
								<div key={item.medicineId} className={styles.summaryItem}>
									<div className={styles.itemThumbWrap}>
										{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className={styles.itemThumb} /> : <div className={styles.itemThumbFallback} />}
										<span className={styles.qtyDot}>{item.quantity}</span>
									</div>
									<div className={styles.itemInfo}>
										<p className={styles.itemName}>{item.name}</p>
										<p className={styles.itemMeta}>{item.category || 'Medicine'}</p>
									</div>
									<p className={styles.itemPrice}>{formatPrice(item.basePrice * item.quantity)}</p>
								</div>
							))}
						</div>

						<div className={styles.couponRow}>
							<div className={styles.couponInputWrap}>
								<Tag size={14} strokeWidth={1.75} />
								<input
									type="text"
									placeholder="Discount code"
									value={couponInput}
									onChange={(e) => setCouponInput(e.target.value)}
									disabled={Boolean(appliedCoupon)}
								/>
							</div>
							<button type="button" className={styles.couponButton} disabled>
								Apply
							</button>
						</div>
						{appliedCoupon ? <p className={styles.couponApplied}>Coupon applied: {appliedCoupon}</p> : null}

						<div className={styles.amountRows}>
							<div className={styles.amountRow}><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
							<div className={styles.amountRow}><span>Shipping</span><strong>{deliveryCharge === 0 ? formatPrice(0) : formatPrice(deliveryCharge)}</strong></div>
							<div className={styles.amountRow}><span className={styles.taxLabel}>Estimated taxes <CircleHelp size={13} strokeWidth={1.75} /></span><strong>{formatPrice(tax)}</strong></div>
							{discountPercent > 0 ? <div className={styles.amountRowDiscount}><span>Discount ({discountPercent}%)</span><strong>-{formatPrice(discount)}</strong></div> : null}
							<div className={styles.totalRow}><span>Total</span><strong>{formatPrice(total)}</strong></div>
						</div>

						<button type="button" onClick={handlePlaceOrder} className={styles.payButton} disabled={isSubmitting || isUploadingPrescription}>
							{isSubmitting ? 'Processing...' : 'Continue to Payment'}
						</button>

						<div className={styles.securityNote}>
							<Lock size={14} strokeWidth={1.75} />
							<Mail size={14} strokeWidth={1.75} />
							<Phone size={14} strokeWidth={1.75} />
							<span>Secure checkout and updates sent to your email/phone.</span>
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}

export default Checkout;
