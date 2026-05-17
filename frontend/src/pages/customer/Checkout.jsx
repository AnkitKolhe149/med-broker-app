import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CircleHelp, Lock, Mail, Phone, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { convertPrice, formatConvertedCurrency, getCurrencyForCountry } from '../../utils/currency';
import orderService from '../../services/order.service';
import shippingService from '../../services/shipping.service';
import addressService from '../../services/address.service';
import styles from './Checkout.module.css';

const COUNTRY_NAME_TO_CODE = {
	India: 'IN',
	'United States': 'US',
	'United Kingdom': 'GB',
	Canada: 'CA',
	Australia: 'AU',
	Germany: 'DE',
	France: 'FR',
	UAE: 'AE',
	Singapore: 'SG',
	Japan: 'JP',
	Kenya: 'KE',
	'South Africa': 'ZA',
	'Saudi Arabia': 'SA',
	Russia: 'RU',
	Brazil: 'BR'
};

const toCountryCode = (value) => {
	const raw = String(value || '').trim();
	if (!raw) return 'IN';
	if (raw.length === 2) return raw.toUpperCase();
	return COUNTRY_NAME_TO_CODE[raw] || 'IN';
};

function Checkout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cartItems, getTotalPrice } = useCart();
	const { currency, exchangeRates } = useCurrency();
	const { user, loading: userLoading } = useUser();
	const { showError } = useNotification();

	const [deliveryType, setDeliveryType] = useState('standard');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [couponInput, setCouponInput] = useState('');
	const [savedAddresses, setSavedAddresses] = useState([]);
	const [selectedAddressId, setSelectedAddressId] = useState(null);
	const [loadingAddresses, setLoadingAddresses] = useState(true);
	const [deliveryAddress, setDeliveryAddress] = useState({
		fullName: '',
		phone: '',
		email: '',
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: ''
	});
	const [orderNotes, setOrderNotes] = useState('');
	const [prescriptionFile, setPrescriptionFile] = useState(null);
	const [prescriptionUrl, setPrescriptionUrl] = useState('');
	const [prescriptionName, setPrescriptionName] = useState('');
	const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [shippingQuote, setShippingQuote] = useState(null);
	const [shippingLoading, setShippingLoading] = useState(false);
	const [shippingError, setShippingError] = useState('');
	const [checkoutCurrency, setCheckoutCurrency] = useState(currency || 'INR');

	const discountPercent = location.state?.discountPercent || 0;
	const appliedCoupon = location.state?.appliedCoupon || '';
	const currencyCode = checkoutCurrency || currency || location.state?.currencyCode || cartItems[0]?.currencyCode || 'INR';

	// ✅ BUG #12: Initialize checkoutCurrency from location.state if provided from Cart
	useEffect(() => {
		if (location.state?.currencyCode) {
			setCheckoutCurrency(location.state.currencyCode);
		}
	}, [location.state?.currencyCode]);
	const formatPrice = (value, fromCurrency = 'INR') => formatConvertedCurrency(value, fromCurrency, currencyCode, exchangeRates, true);
	const toCheckoutCurrency = (value, fromCurrency = 'INR') => convertPrice(value, fromCurrency, currencyCode, exchangeRates);

	const quoteShipping = async () => {
		if (cartItems.length === 0 || !deliveryAddress.country) {
			setShippingQuote(null);
			setShippingError('');
			return;
		}

		setShippingLoading(true);
		setShippingError('');

		try {
			const destinationCountry = toCountryCode(deliveryAddress.country);
			const shipmentBuckets = cartItems.reduce((acc, item) => {
				const origin = toCountryCode(item.originCountry || item.vendorCountry || item.countryCode || 'IN');
				if (!acc[origin]) {
					acc[origin] = [];
				}
				acc[origin].push({
					medicineId: item.medicineId,
					vendorId: item.vendorId,
					quantity: item.quantity,
					selectedSize: item.selectedSize || 'standard',
					unitPrice: item.basePrice
				});
				return acc;
			}, {});

			const shipmentOrigins = Object.keys(shipmentBuckets);
			const hasMixedOrigins = shipmentOrigins.length > 1;
			const shipments = shipmentOrigins.map((originCountry) => ({
				originCountry,
				items: shipmentBuckets[originCountry]
			}));
			const payload = hasMixedOrigins
				? { destinationCountry, shipments }
				: {
					destinationCountry,
					originCountry: shipmentOrigins[0] || 'IN',
					items: shipmentBuckets[shipmentOrigins[0]] || []
				};

			const data = await shippingService.getQuote(payload);
			setShippingQuote(data);
		} catch (error) {
			console.error('Shipping quote failed:', error);
			setShippingQuote(null);
			setShippingError(error?.response?.data?.message || error?.message || 'Unable to calculate shipping cost');
		} finally {
			setShippingLoading(false);
		}
	};

	// State/Province lists by country
	const statesByCountry = useMemo(() => ({
		'India': ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'],
		'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
		'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
		'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
		'Australia': ['New South Wales', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia', 'Australian Capital Territory', 'Northern Territory'],
		'Germany': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
		'France': ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'],
		'UAE': ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'],
		'Singapore': ['Singapore'],
		'Japan': ['Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 'Gifu', 'Gunma', 'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa', 'Kagoshima', 'Kanagawa', 'Kochi', 'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki', 'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Okinawa', 'Osaka', 'Saga', 'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima', 'Tokyo', 'Tottori', 'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'],
		// ✅ BUG #9: Add missing countries for unmapped currencies
		'Saudi Arabia': ['Riyadh', 'Mecca', 'Medina', 'Jeddah', 'Dammam', 'Khobar', 'Eastern Province', 'Western Province', 'Central Province'],
		'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk'],
		'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Bahia', 'Paraná', 'Santa Catarina', 'Pernambuco', 'Ceará', 'Pará', 'Goiás', 'Distrito Federal'],
		'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Free State']
	}), []);

	const getStatesForCountry = (country) => statesByCountry[country] || [];

	const splitFullName = (fullName) => {
		const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
		return {
			first: parts[0] || '',
			last: parts.slice(1).join(' ') || ''
		};
	};

	// Fetch saved addresses and determine user's country
	useEffect(() => {
		const fetchAddresses = async () => {
			try {
				const addresses = await addressService.list();
				setSavedAddresses(addresses);
				
				// Set default address if available
				const defaultAddress = addresses.find((addr) => addr.isDefault);
				if (defaultAddress) {
					const { first, last } = splitFullName(defaultAddress.fullName);
					setSelectedAddressId(defaultAddress.id);
					setFirstName(first);
					setLastName(last);
					setDeliveryAddress({
						fullName: defaultAddress.fullName || '',
						phone: defaultAddress.phone || '',
						email: user?.email || '',
						address: `${defaultAddress.line1}${defaultAddress.line2 ? ' ' + defaultAddress.line2 : ''}`,
						city: defaultAddress.city || '',
						state: defaultAddress.state || '',
						zipCode: defaultAddress.postalCode || '',
						country: defaultAddress.country || user?.customer?.country || 'India'
					});
				} else if (user?.customer) {
					// Fallback to customer profile data
					setDeliveryAddress({
						fullName: user.customer.fullName || user.name || '',
						phone: user.customer.contactNumber || user.mobile || '',
						email: user.email || '',
						address: user.customer.deliveryAddress || '',
						city: user.customer.city || '',
						state: user.customer.state || '',
						zipCode: user.customer.zipCode || '',
						country: user.customer.country || 'India'
					});
				}
			} catch (error) {
				console.error('Failed to fetch addresses:', error);
			} finally {
				setLoadingAddresses(false);
			}
		};

		const fullName = user?.customer?.fullName || user?.name || '';
		const parts = fullName.trim().split(/\s+/).filter(Boolean);
		const initialFirst = parts[0] || '';
		const initialLast = parts.slice(1).join(' ');

		setFirstName(initialFirst);
		setLastName(initialLast);

		if (user) {
			fetchAddresses();
		}

		if (user?.customer?.country && !deliveryAddress.country) {
			setDeliveryAddress((prev) => ({
				...prev,
				country: user.customer.country
			}));
		}
	}, [user]);

	useEffect(() => {
		quoteShipping();
	}, [cartItems, deliveryAddress.country, deliveryAddress.city, deliveryAddress.state, deliveryAddress.zipCode, deliveryAddress.address]);

	// Update checkout currency when delivery country changes
	useEffect(() => {
		if (deliveryAddress.country) {
			const countryFormatted = String(deliveryAddress.country).trim().toUpperCase();
			const detectedCurrency = getCurrencyForCountry(countryFormatted, 'INR');
			setCheckoutCurrency(detectedCurrency);
		}
	}, [deliveryAddress.country]);

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
		return true;
	};

	const handlePlaceOrder = async (event) => {
		event.preventDefault();
		if (!validateForm()) return;

		setIsSubmitting(true);
		try {
			const destinationCountry = toCountryCode(deliveryAddress.country);
			const shipmentBuckets = cartItems.reduce((acc, item) => {
				const origin = toCountryCode(item.originCountry || item.vendorCountry || item.countryCode || 'IN');
				if (!acc[origin]) {
					acc[origin] = [];
				}
				acc[origin].push({
					medicineId: item.medicineId,
					vendorId: item.vendorId,
					quantity: item.quantity,
					selectedSize: item.selectedSize || 'standard'
				});
				return acc;
			}, {});
			const shipmentOrigins = Object.keys(shipmentBuckets);
			const hasMixedOrigins = shipmentOrigins.length > 1;
			const shipments = shipmentOrigins.map((originCountry) => ({
				originCountry,
				items: shipmentBuckets[originCountry]
			}));
			const originCountry = hasMixedOrigins ? undefined : (shipmentOrigins[0] || 'IN');

			const createdOrder = await orderService.createCustomerOrder({
				items: cartItems.map((item) => ({
					medicineId: item.medicineId,
					vendorId: item.vendorId,
					quantity: item.quantity,
					selectedSize: item.selectedSize || 'standard'
				})),
				destinationCountry,
				originCountry,
				...(hasMixedOrigins ? { shipments } : {}),
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
					destinationCountry,
					originCountry,
					...(hasMixedOrigins ? { shipments } : {}),
					deliveryAddress,
					deliveryType,
					orderNotes,
					prescriptionUrl,
					prescriptionName,
					discountPercent,
					appliedCoupon,
					currencyCode,
					paymentProvider: 'razorpay',
					paymentMethod: 'Razorpay Secure Checkout',
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
				paymentProvider: 'razorpay',
				paymentMethod: 'Razorpay Secure Checkout',
				subtotal,
				discount,
				deliveryCharge,
				tax,
				total,
				currencyCode,
				timestamp: new Date().toISOString()
			};

			sessionStorage.setItem('pending_order', JSON.stringify(orderData));
			navigate(`/customer/payment?orderId=${createdOrder.id}`);
		} catch (error) {
			console.error('Order creation failed:', error);
			showError(error?.response?.data?.message || error?.message || 'Failed to create order');
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

	const subtotal = getTotalPrice(checkoutCurrency);
	const discount = (subtotal * discountPercent) / 100;
	const standardShippingCharge = shippingQuote ? toCheckoutCurrency(shippingQuote.totalShipping, 'INR') : 0;
	const expressShippingCharge = Number((standardShippingCharge + toCheckoutCurrency(9, 'INR')).toFixed(2));
	const deliveryCharge = deliveryType === 'express' ? expressShippingCharge : standardShippingCharge;
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
					{!loadingAddresses && savedAddresses.length > 0 && (
						<div className={styles.savedAddressesSection}>
							<h3 className={styles.savedAddressesTitle}>Select Saved Address</h3>
							<div className={styles.savedAddressesList}>
								{savedAddresses.map((addr) => (
									<div
										key={addr.id}
										className={`${styles.savedAddressCard} ${selectedAddressId === addr.id ? styles.selectedAddress : ''}`}
										onClick={() => {
											const { first, last } = splitFullName(addr.fullName || '');
											setSelectedAddressId(addr.id);
											setFirstName(first);
											setLastName(last);
											setDeliveryAddress({
												fullName: addr.fullName || '',
												phone: addr.phone || '',
												email: user?.email || '',
												address: `${addr.line1}${addr.line2 ? ' ' + addr.line2 : ''}`,
												city: addr.city || '',
												state: addr.state || '',
												zipCode: addr.postalCode || '',
												country: addr.country || 'India'
											});
										}}
									>
										<div className={styles.addressCardLabel}>{addr.label || 'Saved Address'}</div>
										<div className={styles.addressCardText}>
											<p>{addr.fullName}</p>
											<p>{addr.line1}, {addr.city}, {addr.state}</p>
											<p>{addr.country} - {addr.postalCode}</p>
										</div>
									</div>
								))}
							</div>
							<button
								type="button"
								className={styles.addNewAddressButton}
								onClick={() => {
									setSelectedAddressId(null);
									setFirstName('');
									setLastName('');
									setDeliveryAddress({
										fullName: '',
										phone: '',
										email: user?.email || '',
										address: '',
										city: '',
										state: '',
										zipCode: '',
										country: user?.customer?.country || 'India'
									});
								}}
							>
								+ Add New Address
							</button>
						</div>
					)}
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
							<label className={styles.fieldLabel}>State/Province*</label>
							{getStatesForCountry(deliveryAddress.country).length > 0 ? (
								<select name="state" className={styles.fieldInput} value={deliveryAddress.state} onChange={handleAddressChange}>
									<option value="">Select State/Province</option>
									{getStatesForCountry(deliveryAddress.country).map((stateName) => (
										<option key={stateName} value={stateName}>{stateName}</option>
									))}
								</select>
							) : (
								<input name="state" className={styles.fieldInput} value={deliveryAddress.state} onChange={handleAddressChange} placeholder="State/Province" />
							)}
						</div>

						<div className={styles.fieldGroup}>
							<label className={styles.fieldLabel}>Zip Code*</label>
							<input name="zipCode" className={styles.fieldInput} value={deliveryAddress.zipCode} onChange={handleAddressChange} placeholder="PIN / ZIP" />
						</div>
						<div className={styles.fieldGroup}>
							<label className={styles.fieldLabel}>Country*</label>
							<select name="country" className={styles.fieldInput} value={deliveryAddress.country} onChange={(e) => {
								handleAddressChange(e);
								setDeliveryAddress((prev) => ({ ...prev, state: '' }));
							}}>
								<option value="">Select Country</option>
								<option value="India">India</option>
								<option value="United States">United States</option>
								<option value="United Kingdom">United Kingdom</option>
								<option value="Canada">Canada</option>
								<option value="Australia">Australia</option>
								<option value="Germany">Germany</option>
								<option value="France">France</option>
								<option value="UAE">UAE</option>
								<option value="Singapore">Singapore</option>
								<option value="Japan">Japan</option>
							</select>
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
									<p className={styles.shippingLabel}>Standard Shipping</p>
									<p className={styles.shippingEta}>5-7 Days</p>
								</div>
								<strong>{shippingLoading ? 'Calculating...' : formatPrice(standardShippingCharge, currencyCode)}</strong>
							</label>
							<label className={`${styles.shippingCard} ${deliveryType === 'express' ? styles.shippingCardActive : ''}`}>
								<input type="radio" name="deliveryType" value="express" checked={deliveryType === 'express'} onChange={(e) => setDeliveryType(e.target.value)} />
								<div>
									<p className={styles.shippingLabel}>Express Shipping</p>
									<p className={styles.shippingEta}>1-3 Days</p>
								</div>
								<strong>{shippingLoading ? 'Calculating...' : formatPrice(expressShippingCharge, currencyCode)}</strong>
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
									<p className={styles.itemPrice}>{formatPrice(item.basePrice * item.quantity, item.currencyCode || currencyCode)}</p>
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
							<div className={styles.amountRow}><span>Subtotal</span><strong>{formatPrice(subtotal, currencyCode)}</strong></div>
							<div className={styles.amountRow}><span>Shipping</span><strong>{deliveryCharge === 0 ? formatPrice(0, currencyCode) : formatPrice(deliveryCharge, currencyCode)}</strong></div>
							<div className={styles.amountRow}><span className={styles.taxLabel}>Estimated taxes <CircleHelp size={13} strokeWidth={1.75} /></span><strong>{formatPrice(tax, currencyCode)}</strong></div>
							{discountPercent > 0 ? <div className={styles.amountRowDiscount}><span>Discount ({discountPercent}%)</span><strong>-{formatPrice(discount, currencyCode)}</strong></div> : null}
							<div className={styles.totalRow}><span>Total</span><strong>{formatPrice(total, currencyCode)}</strong></div>
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
