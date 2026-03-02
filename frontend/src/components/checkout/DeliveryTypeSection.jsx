import React from 'react';
import styles from './Checkout.module.css';

export function DeliveryTypeSection({ deliveryType, setDeliveryType }) {
  return (
    <div className={styles.formCard}>
      <h2 className={styles.cardTitle}>Delivery Type</h2>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="deliveryType"
            value="home_delivery"
            checked={deliveryType === 'home_delivery'}
            onChange={(e) => setDeliveryType(e.target.value)}
            className={styles.radioInput}
          />
          <span>Home Delivery (Within India)</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="deliveryType"
            value="store_pickup"
            checked={deliveryType === 'store_pickup'}
            onChange={(e) => setDeliveryType(e.target.value)}
            className={styles.radioInput}
          />
          <span>Store Pickup</span>
        </label>
      </div>
    </div>
  );
}
