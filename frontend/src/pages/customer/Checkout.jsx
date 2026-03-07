import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { useCheckoutForm } from '../../hooks/useCheckoutForm';
import Avatar from '../../components/common/Avatar';
import { DeliveryTypeSection } from '../../components/checkout/DeliveryTypeSection';
import { DeliveryAddressForm } from '../../components/checkout/DeliveryAddressForm';
import { OrderNotesSection } from '../../components/checkout/OrderNotesSection';
import { TermsAgreement } from '../../components/checkout/TermsAgreement';
import { OrderSummary } from '../../components/checkout/OrderSummary';
import styles from '../../components/checkout/Checkout.module.css';

function Checkout() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cartItems, getTotalPrice } = useCart();
	const { user, loading: userLoading } = useUser();
	const { showError } = useNotification();

	const form = useCheckoutForm(user?.customer, user?.email, showError);

	const discountPercent = location.state?.discountPercent || 0;
	const appliedCoupon = location.state?.appliedCoupon || '';

	const handlePlaceOrder = async (e) => {
		e.preventDefault();
		if (!form.validateForm()) return;

		form.setIsSubmitting(true);
		try {
			const orderData = {
				cartItems,
				deliveryAddress: form.deliveryAddress,
				deliveryType: form.deliveryType,
				orderNotes: form.orderNotes,
				discountPercent,
				appliedCoupon,
				subtotal: getTotalPrice(),
				timestamp: new Date().toISOString()
			};

			sessionStorage.setItem('pending_order', JSON.stringify(orderData));
			navigate('/customer/payment');
		} catch (error) {
			console.error('Failed to place order:', error);
			showError('Failed to place order. Please try again.');
		} finally {
			form.setIsSubmitting(false);
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
					<div className={styles.emptyState}>
						<p>Your cart is empty. Please add items before checkout.</p>
						<button 
							onClick={() => navigate('/customer/catalog')}
							className={styles.backLink}
						>
							← Back to Catalog
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
						<h1 className="section-title">Checkout</h1>
						<p className="section-subtitle">Complete your delivery and payment details</p>
					</div>
				</div>

				<div className={styles.mainContent}>
					{/* Left: Delivery & Payment Form */}
					<section className="section" style={{ padding: '2rem' }}>
						<form onSubmit={handlePlaceOrder} className={styles.formContainer}>
							{/* User Info Section */}
							<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)' }}>
								<Avatar 
									src={user?.customer?.profileImage}
									name={user?.customer?.fullName}
									size={50}
								/>
								<div>
									<p style={{ fontWeight: 500 }}>{user?.customer?.fullName || user?.email}</p>
									<p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
								</div>
							</div>

							<DeliveryTypeSection 
								deliveryType={form.deliveryType}
								setDeliveryType={form.setDeliveryType}
							/>
							<DeliveryAddressForm 
								deliveryAddress={form.deliveryAddress}
								handleAddressChange={form.handleAddressChange}
							/>
							<OrderNotesSection 
								orderNotes={form.orderNotes}
								setOrderNotes={form.setOrderNotes}
							/>
							<TermsAgreement 
								agreeTerms={form.agreeTerms}
								setAgreeTerms={form.setAgreeTerms}
							/>
							<button
								type="submit"
								disabled={form.isSubmitting}
								className={styles.submitButton}
								style={{ opacity: form.isSubmitting ? 0.6 : 1 }}
							>
								{form.isSubmitting ? 'Processing...' : 'Continue to Payment'}
							</button>
						</form>
					</section>

					{/* Right: Order Summary */}
					<OrderSummary 
						cartItems={cartItems}
						getTotalPrice={getTotalPrice}
						discountPercent={discountPercent}
						appliedCoupon={appliedCoupon}
					/>
				</div>
			</div>
		</main>
	);
}

export default Checkout;
