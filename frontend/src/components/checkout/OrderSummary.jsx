import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { formatConvertedCurrency } from '../../utils/currency';
import styles from './Checkout.module.css';

export function OrderSummary({ cartItems, getTotalPrice, discountPercent, appliedCoupon, deliveryType = 'standard' }) {
  const { currency, exchangeRates, convert } = useCurrency();
  const currencyCode = currency || 'USD';
  // formatPrice expects values in currencyCode (already converted by getTotalPrice and convert)
  const formatPrice = (value, sourceCurrency = currencyCode) => formatConvertedCurrency(value, sourceCurrency, currencyCode, exchangeRates, true);
  const subtotal = getTotalPrice();
  const discount = (subtotal * discountPercent) / 100;
  // Convert delivery charge from INR to user's currency
  const deliveryCharge = deliveryType === 'express' ? (typeof convert === 'function' ? convert(9, 'INR') : 9) : 0;
  const tax = (subtotal - discount + deliveryCharge) * 0.05;
  const total = subtotal - discount + deliveryCharge + tax;

  return (
    <div className={styles.summarySection}>
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Order Summary</h2>

        {/* Items */}
        <div className={styles.itemsList}>
          {cartItems.map(item => (
            <div key={item.medicineId} className={styles.summaryItem}>
              <div>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemQty}>Qty: {item.quantity}</p>
              </div>
              <p className={styles.itemAmount}>{formatPrice(item.basePrice * item.quantity)}</p>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* Pricing */}
        <div className={styles.pricingBreakdown}>
          <div className={styles.pricingRow}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discountPercent > 0 && (
            <div className={styles.pricingRow} style={{ color: 'var(--success)' }}>
              <span>Discount ({discountPercent}%)</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          {appliedCoupon && (
            <div className={styles.couponBadgeRow}>
              <span className={styles.couponBadge}>{appliedCoupon}</span>
            </div>
          )}
          <div className={styles.pricingRow}>
            <span>Delivery Charge</span>
            <span>{deliveryCharge === 0 ? 'Free' : formatPrice(deliveryCharge)}</span>
          </div>
          <div className={styles.pricingRow}>
            <span>Tax (5% GST)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}><Info size={16} strokeWidth={1.75} /></span>
          <p className={styles.infoText}>
            Check your phone and email for order confirmation and tracking details.
          </p>
        </div>

        <div className={styles.infoBox}>
          <span className={styles.infoIcon}><ShieldCheck size={16} strokeWidth={1.75} /></span>
          <p className={styles.infoText}>
            Your information is secure and protected with SSL encryption.
          </p>
        </div>
      </div>
    </div>
  );
}
