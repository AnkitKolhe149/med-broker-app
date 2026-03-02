// Form validation utilities
// Provides common validation functions for user input

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate password strength
 * Requirements: min 8 chars, at least 1 uppercase, 1 number
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error: string, strength: 'weak'|'medium'|'strong' }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required', strength: 'weak' };
  }

  let strength = 'weak';
  const errors = [];

  if (password.length < 8) {
    errors.push('at least 8 characters');
  } else {
    strength = 'medium';
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('1 uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('1 lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('1 number');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('1 special character');
    if (strength === 'medium') strength = 'weak';
  } else {
    strength = 'strong';
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: `Password must contain: ${errors.join(', ')}`,
      strength
    };
  }

  return { isValid: true, error: '', strength };
};

/**
 * Validate phone number (India format: 10 digits starting with 6-9)
 * @param {string} phone - Phone number to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/[^0-9]/g, ''))) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate that passwords match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate required string field
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || !value.toString().trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum character length
 * @param {string} fieldName - Name of field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value || value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }

  return { isValid: true, error: '' };
};

/**
 * Validate GSTIN format (for vendor onboarding)
 * Format: 22AAAAA0000A1Z5 (15 characters)
 * @param {string} gstin - GSTIN to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateGSTIN = (gstin) => {
  if (!gstin || !gstin.trim()) {
    return { isValid: false, error: 'GSTIN is required' };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin.toUpperCase())) {
    return { isValid: false, error: 'Please enter a valid 15-character GSTIN' };
  }

  return { isValid: true, error: '' };
};
