import React from 'react';
import styles from './Checkout.module.css';

export function DeliveryAddressForm({ deliveryAddress, handleAddressChange }) {
  const formFields = [
    { name: 'fullName', label: 'Full Name *', type: 'text', placeholder: 'Enter your full name' },
    { name: 'phone', label: 'Phone Number *', type: 'tel', placeholder: '10-digit mobile number' },
    { name: 'email', label: 'Email Address *', type: 'email', placeholder: 'your.email@example.com', fullWidth: true },
    { name: 'address', label: 'Street Address *', type: 'text', placeholder: 'House No., Building Name, Street', fullWidth: true },
    { name: 'city', label: 'City *', type: 'text', placeholder: 'City' },
    { name: 'state', label: 'State *', type: 'text', placeholder: 'State' },
    { name: 'zipCode', label: 'PIN Code *', type: 'text', placeholder: '6-digit PIN code' },
    { name: 'country', label: 'Country', type: 'text', placeholder: 'Country', disabled: true }
  ];

  return (
    <div className={styles.formCard}>
      <h2 className={styles.cardTitle}>Delivery Address</h2>
      <div className={styles.formGrid}>
        {formFields.map(field => (
          <div
            key={field.name}
            className={styles.formGroup}
            style={{ gridColumn: field.fullWidth ? '1 / -1' : 'auto' }}
          >
            <label className={styles.label}>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={deliveryAddress[field.name]}
              onChange={handleAddressChange}
              className={styles.input}
              placeholder={field.placeholder}
              disabled={field.disabled}
              style={field.disabled ? { backgroundColor: 'var(--surface)' } : {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
