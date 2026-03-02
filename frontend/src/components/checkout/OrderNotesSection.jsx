import React from 'react';
import styles from './Checkout.module.css';

export function OrderNotesSection({ orderNotes, setOrderNotes }) {
  return (
    <div className={styles.formCard}>
      <h2 className={styles.cardTitle}>Special Instructions (Optional)</h2>
      <textarea
        value={orderNotes}
        onChange={(e) => setOrderNotes(e.target.value)}
        placeholder="e.g., Please deliver on morning, Leave at reception, etc."
        className={styles.textarea}
        rows="4"
      />
    </div>
  );
}
