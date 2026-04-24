/**
 * Payment Gateway Configuration
 * Supports multiple payment providers (Stripe, Razorpay, PayPal, etc.)
 */

const isEnabled = (value) => String(value).toLowerCase() === 'true';

const hasRazorpayConfig = isEnabled(process.env.RAZORPAY_ENABLED)
  && Boolean(process.env.RAZORPAY_KEY_ID)
  && Boolean(process.env.RAZORPAY_KEY_SECRET);

const hasStripeConfig = isEnabled(process.env.STRIPE_ENABLED)
  && Boolean(process.env.STRIPE_SECRET_KEY)
  && Boolean(process.env.STRIPE_PUBLISHABLE_KEY);

const hasPaypalConfig = isEnabled(process.env.PAYPAL_ENABLED)
  && Boolean(process.env.PAYPAL_CLIENT_ID)
  && Boolean(process.env.PAYPAL_CLIENT_SECRET);

const firstConfiguredProvider = hasRazorpayConfig
  ? 'razorpay'
  : hasStripeConfig
    ? 'stripe'
    : hasPaypalConfig
      ? 'paypal'
      : 'mock';

const PAYMENT_CONFIG = {
  // Default provider
  defaultProvider: process.env.PAYMENT_PROVIDER || firstConfiguredProvider,

  // Razorpay configuration (popular in India for medicine marketplace)
  razorpay: {
    enabled: process.env.RAZORPAY_ENABLED === 'true',
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    routeEnabled: process.env.RAZORPAY_ROUTE_ENABLED === 'true',
    routeStrict: process.env.RAZORPAY_ROUTE_STRICT === 'true',
    // Enable automated payouts by admin approval
    payoutsEnabled: process.env.RAZORPAY_PAYOUTS_ENABLED === 'true',
    // Optional default source of payouts (platform fund account / virtual account)
    payoutsSourceAccount: process.env.RAZORPAY_PAYOUTS_SOURCE_ACCOUNT || null
  },

  // Stripe configuration
  stripe: {
    enabled: process.env.STRIPE_ENABLED === 'true',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  // PayPal configuration
  paypal: {
    enabled: process.env.PAYPAL_ENABLED === 'true',
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox' // 'sandbox' or 'live'
  },

  // Currency settings
  currency: process.env.PAYMENT_CURRENCY || 'INR',

  // Payment timeout (in milliseconds)
  paymentTimeout: parseInt(process.env.PAYMENT_TIMEOUT) || 900000, // 15 minutes

  // Refund settings
  refund: {
    enabled: process.env.REFUND_ENABLED !== 'false',
    processingDays: parseInt(process.env.REFUND_PROCESSING_DAYS) || 7
  },

  commission: {
    percent: Number.parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || '5') || 0
  }
};

module.exports = PAYMENT_CONFIG;
