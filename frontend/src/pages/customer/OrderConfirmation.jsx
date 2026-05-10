import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
	ArrowRight,
	BadgeCheck,
	CalendarClock,
	CheckCircle2,
	Download,
	MapPin,
	Mail,
	Package,
	Phone,
	ReceiptText,
	ShoppingBag,
	Truck,
	UserRound
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import { useCurrency } from '../../context/CurrencyContext';
import { useUser } from '../../context/UserContext';
import { formatCurrency, formatConvertedCurrency } from '../../utils/currency';
import orderService from '../../services/order.service';
import styles from './OrderConfirmation.module.css';

function OrderConfirmation() {
	const { orderId } = useParams();
	const navigate = useNavigate();
	const { user } = useUser();
	const { currency, exchangeRates, convert } = useCurrency();
	const [orderData, setOrderData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);
	const [invoiceError, setInvoiceError] = useState('');
	const currentCurrency = currency || 'INR';
	const orderCurrency = orderData?.currencyCode || currentCurrency;
	const formatPrice = (value, targetCurrency = orderCurrency) => formatConvertedCurrency(value, 'INR', targetCurrency, exchangeRates, true);
	const toDisplayAmount = (value) => value;

	// ✅ BUG #10: Add state/province lists for all countries
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
		'Saudi Arabia': ['Riyadh', 'Mecca', 'Medina', 'Jeddah', 'Dammam', 'Khobar', 'Eastern Province', 'Western Province', 'Central Province'],
		'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk'],
		'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Bahia', 'Paraná', 'Santa Catarina', 'Pernambuco', 'Ceará', 'Pará', 'Goiás', 'Distrito Federal'],
		'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Free State']
	}), []);

	const getStatesForCountry = (country) => statesByCountry[country] || [];

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

		const sourceCartItems = source?.cartItems || [];

		return {
			...snapshot,
			orderId: source?.id || source?.orderId || snapshot.orderId || orderId,
			cartItems: snapshot.cartItems || (sourceCartItems.length > 0 ? sourceCartItems : backendItems),
			deliveryAddress: snapshot.deliveryAddress || source?.deliveryAddress || {},
			deliveryType: snapshot.deliveryType || source?.deliveryType || 'standard',
			orderNotes: snapshot.orderNotes || source?.orderNotes || '',
			prescriptionUrl: snapshot.prescriptionUrl || source?.prescriptionUrl || '',
			prescriptionName: snapshot.prescriptionName || source?.prescriptionName || '',
			discountPercent: snapshot.discountPercent ?? source?.discountPercent ?? 0,
			appliedCoupon: snapshot.appliedCoupon || source?.appliedCoupon || '',
			currencyCode: snapshot.currencyCode || source?.currencyCode || currentCurrency,
			subtotalBase: snapshot.subtotalBase ?? source?.subtotalBase ?? snapshot.subtotal ?? ((pricingSummary.subtotalCents || 0) / 100),
			subtotal: snapshot.subtotal ?? source?.subtotal ?? ((pricingSummary.subtotalCents || 0) / 100),
			discountBase: snapshot.discountBase ?? source?.discountBase ?? snapshot.discount ?? ((pricingSummary.discountCents || 0) / 100),
			discount: snapshot.discount ?? source?.discount ?? ((pricingSummary.discountCents || 0) / 100),
			deliveryBase: snapshot.deliveryBase ?? source?.deliveryBase ?? snapshot.deliveryCharge ?? ((pricingSummary.deliveryChargeCents || 0) / 100),
			deliveryCharge: snapshot.deliveryCharge ?? source?.deliveryCharge ?? ((pricingSummary.deliveryChargeCents || 0) / 100),
			taxBase: snapshot.taxBase ?? source?.taxBase ?? snapshot.tax ?? ((pricingSummary.taxCents || 0) / 100),
			tax: snapshot.tax ?? source?.tax ?? ((pricingSummary.taxCents || 0) / 100),
			totalBase: snapshot.totalBase ?? source?.totalBase ?? snapshot.total ?? ((pricingSummary.totalCents || 0) / 100),
			total: snapshot.total ?? source?.total ?? ((pricingSummary.totalCents || 0) / 100),
			paymentMethod: snapshot.paymentMethod || source?.paymentMethod || 'upi'
		};
	};

	useEffect(() => {
		const completedOrder = sessionStorage.getItem('completed_order');
		if (completedOrder) {
			try {
				setOrderData(normalizeOrderData(JSON.parse(completedOrder)));
				setLoading(false);
				return;
			} catch (error) {
				console.error('Failed to parse order data:', error);
			}
		}

		const loadOrder = async () => {
			try {
				const backendOrder = await orderService.getCustomerOrderById(orderId);
				setOrderData(normalizeOrderData(backendOrder));
			} catch (error) {
				console.error('Failed to load order from backend:', error);
				navigate('/customer/dashboard');
			} finally {
				setLoading(false);
			}
		};

		loadOrder();
	}, [navigate, orderId]);

	const handleDownloadInvoice = async () => {
		try {
			setInvoiceError('');
			const blob = await orderService.downloadOrderReceipt(orderData.orderId);
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = `receipt_${orderData.orderId}.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(downloadUrl);

			setInvoiceDownloaded(true);
		} catch (error) {
			console.error('Failed to download receipt:', error);
			setInvoiceError('Unable to download receipt right now. Please try again.');
		}
	};

	const getSubtotal = () => {
		if (!orderData) return 0;
		if (orderData.subtotalBase !== undefined && orderData.subtotalBase !== null) {
			return Number(orderData.subtotal || orderData.subtotalBase || 0);
		}
		return Number(orderData.subtotal || 0);
	};

	const getDeliveryCharge = () => {
		if (!orderData) return 0;
		const rawDelivery = Number(orderData.deliveryCharge ?? orderData.deliveryBase ?? (orderData.deliveryType === 'express' ? 9 : 0));
		return rawDelivery;
	};

	const calculateTax = () => {
		if (orderData?.tax !== undefined && orderData?.tax !== null) {
			return Number(orderData.tax);
		}
		const subtotal = getSubtotal();
		const discount = Number(orderData?.discount || ((subtotal * (orderData?.discountPercent || 0)) / 100));
		return Number(((subtotal - discount + getDeliveryCharge()) * 0.05).toFixed(2));
	};

	const getTotalPaid = () => {
		if (!orderData) return 0;
		if (orderData.totalBase !== undefined && orderData.totalBase !== null) {
			return Number(orderData.total || orderData.totalBase || 0);
		}
		if (orderData.total !== undefined && orderData.total !== null) {
			return Number(orderData.total);
		}
		const subtotal = getSubtotal();
		const discount = (subtotal * (orderData.discountPercent || 0)) / 100;
		return Number((subtotal - discount + getDeliveryCharge() + calculateTax()).toFixed(2));
	};

	const getEstimatedDeliveryText = () => {
		if (!orderData) return 'Within 3-5 business days';
		if (orderData.deliveryType === 'express') return 'Expected in 1-3 business days';
		return 'Expected in 3-5 business days';
	};

	if (loading) {
		return (
			<div className={styles.loadingState}>
				<div className={styles.loadingSpinner} />
				<p>Loading order confirmation...</p>
			</div>
		);
	}

	if (!orderData) {
		return (
			<main className={`page ${styles.confirmationPage}`}>
				<div className="container">
					<div className={styles.emptyState}>
						<p>Order not found.</p>
						<button type="button" className={styles.secondaryAction} onClick={() => navigate('/customer/dashboard')}>
							Go to Dashboard
						</button>
					</div>
				</div>
			</main>
		);
	}

	const subtotal = getSubtotal();
	const discount = Number(orderData.discount ?? ((subtotal * (orderData.discountPercent || 0)) / 100));
	const deliveryCharge = getDeliveryCharge();
	const tax = calculateTax();
	const totalPaid = getTotalPaid();

	return (
		<main className={`page ${styles.confirmationPage}`}>
			<div className={`container ${styles.confirmationContainer}`}>
				<section className={styles.heroCard}>
					<div className={styles.heroBadge}><CheckCircle2 size={18} strokeWidth={2} /> Payment Successful</div>
					<h1 className={styles.heroTitle}>Order Confirmed</h1>
					<p className={styles.heroSubtitle}>Thanks for your purchase. Your medicines are being prepared for dispatch.</p>
					<div className={styles.heroMeta}>
						<p><span>Order ID</span><strong>{orderData.orderId || orderId}</strong></p>
						<p><span>Estimated Delivery</span><strong>{getEstimatedDeliveryText()}</strong></p>
						<p><span>Total Paid</span><strong>{formatPrice(totalPaid, orderCurrency)}</strong></p>
					</div>
				</section>

				<div className={styles.gridLayout}>
					<section className={styles.leftPanel}>
						<div className={styles.customerCard}>
							<Avatar src={user?.customer?.profileImage} name={user?.customer?.fullName || user?.email} size={54} />
							<div>
								<p className={styles.customerName}>{user?.customer?.fullName || user?.email}</p>
								<p className={styles.customerEmail}><Mail size={13} strokeWidth={1.9} /> {user?.email}</p>
							</div>
						</div>

						<div className={styles.stageCard}>
							<div className={styles.stageRow}><BadgeCheck size={16} strokeWidth={1.8} /><span>Order Confirmed</span><small>Completed</small></div>
							<div className={styles.stageRow}><ReceiptText size={16} strokeWidth={1.8} /><span>Invoice Ready</span><small>Available now</small></div>
							<div className={styles.stageRow}><Truck size={16} strokeWidth={1.8} /><span>Packed for Dispatch</span><small>In progress</small></div>
							<div className={styles.stageRow}><CalendarClock size={16} strokeWidth={1.8} /><span>Delivery Window</span><small>{getEstimatedDeliveryText()}</small></div>
						</div>

						<div className={styles.contentCard}>
							<h2 className={styles.cardTitle}>Items Ordered</h2>
							{(orderData.cartItems || []).map((item, index) => (
								<div key={`${item.medicineId || item.name}-${index}`} className={styles.itemRow}>
									<div>
										<p className={styles.itemName}>{item.name}</p>
										<p className={styles.itemVendor}>{item.vendor ? `Vendor: ${item.vendor}` : 'Verified Partner'}</p>
									</div>
									<div className={styles.itemRight}>
										<p className={styles.itemQty}>Qty {item.quantity}</p>
										<p className={styles.itemPrice}>{formatPrice(item.basePrice * item.quantity, orderCurrency)}</p>
									</div>
								</div>
							))}
						</div>

						<div className={styles.contentCard}>
							<h2 className={styles.cardTitle}>Delivery Address</h2>
							<div className={styles.addressBox}>
								<p className={styles.addressName}><UserRound size={14} strokeWidth={1.9} /> {orderData.deliveryAddress.fullName}</p>
								<p>{orderData.deliveryAddress?.address}</p>
								<p>{orderData.deliveryAddress?.city}, {orderData.deliveryAddress?.state} {orderData.deliveryAddress?.zipCode}</p>
								<p>{orderData.deliveryAddress?.country}</p>
								<p><Phone size={14} strokeWidth={1.85} /> {orderData.deliveryAddress?.phone}</p>
								<p><Mail size={14} strokeWidth={1.85} /> {orderData.deliveryAddress?.email}</p>
							</div>
							<div className={styles.deliveryNote}><MapPin size={14} strokeWidth={1.85} /> {getEstimatedDeliveryText()}</div>
						</div>

						{orderData.orderNotes ? (
							<div className={styles.contentCard}>
								<h2 className={styles.cardTitle}>Special Instructions</h2>
								<p className={styles.notes}>{orderData.orderNotes}</p>
							</div>
						) : null}

						<div className={styles.actionGrid}>
							<button type="button" className={styles.primaryAction} onClick={handleDownloadInvoice}>
								<Download size={15} strokeWidth={1.9} /> Download Invoice
							</button>
							<button type="button" className={styles.secondaryAction} onClick={() => navigate('/customer/orders')}>
								<Package size={15} strokeWidth={1.9} /> Track Order
							</button>
							<button type="button" className={styles.secondaryAction} onClick={() => navigate('/customer/catalog')}>
								<ShoppingBag size={15} strokeWidth={1.9} /> Continue Shopping
							</button>
						</div>

						{invoiceDownloaded ? <p className={styles.feedbackSuccess}>Invoice downloaded successfully.</p> : null}
						{invoiceError ? <p className={styles.feedbackError}>{invoiceError}</p> : null}
					</section>

					<aside className={styles.summaryPanel}>
						<h2 className={styles.summaryTitle}>Payment Recap</h2>
						<div className={styles.summaryCard}>
							<div className={styles.summaryRow}><span>Subtotal</span><strong>{formatPrice(subtotal, orderCurrency)}</strong></div>
							{orderData.discountPercent > 0 ? (
								<div className={styles.summaryDiscount}><span>Discount ({orderData.discountPercent}%)</span><strong>-{formatPrice(discount, orderCurrency)}</strong></div>
							) : null}
							<div className={styles.summaryRow}><span>Shipping</span><strong>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge, orderCurrency)}</strong></div>
							<div className={styles.summaryRow}><span>Tax (5%)</span><strong>{formatPrice(tax, orderCurrency)}</strong></div>
							<div className={styles.summaryTotal}><span>Total Paid</span><strong>{formatPrice(totalPaid, orderCurrency)}</strong></div>
						</div>

						<div className={styles.statusCard}>
							<p><span>Payment Method</span><strong>{(orderData.paymentMethod || 'UPI').toUpperCase()}</strong></p>
							<p><span>Status</span><strong className={styles.statusSuccess}>CONFIRMED</strong></p>
							<p><span>Confirmation Email</span><strong>{orderData.deliveryAddress?.email}</strong></p>
						</div>

						<button type="button" className={styles.trackButton} onClick={() => navigate('/customer/orders')}>
							Go to Order Tracking <ArrowRight size={15} strokeWidth={2} />
						</button>

						<div className={styles.supportCard}>
							<p className={styles.supportTitle}>Need help with this order?</p>
							<a href="mailto:support@mediq.com" className={styles.supportLink}><Mail size={14} strokeWidth={1.9} /> support@mediq.com</a>
							<p className={styles.supportPhone}><Phone size={14} strokeWidth={1.9} /> +91-1234-567-890</p>
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}
export default OrderConfirmation;
