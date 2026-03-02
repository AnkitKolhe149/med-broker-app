import React from 'react';
import styles from './Checkout.module.css';

export function TermsAgreement({ agreeTerms, setAgreeTerms }) {
  return (
    <div className={styles.formCard}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
          className={styles.checkbox}
        />
        <span>
          I agree to the <a href="#" className={styles.link}>terms and conditions</a> and{' '}
          <a href="#" className={styles.link}>privacy policy</a>
        </span>
      </label>
    </div>
  );
}
