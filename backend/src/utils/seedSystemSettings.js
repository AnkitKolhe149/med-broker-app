const { prisma } = require('../database/prisma');

const DEFAULT_SETTINGS = [
  // Localization & Defaults
  {
    key: 'PLATFORM_CURRENCY',
    value: process.env.PLATFORM_CURRENCY || 'USD',
    label: 'Platform Default Currency',
    description: 'Default currency for the entire platform',
    category: 'Localization & Defaults',
    type: 'STRING',
    isEditable: true,
  },
  {
    key: 'PLATFORM_LOCALE',
    value: process.env.PLATFORM_LOCALE || 'en-US',
    label: 'Platform Locale',
    description: 'Language and region settings for the platform',
    category: 'Localization & Defaults',
    type: 'STRING',
    isEditable: true,
  },
  {
    key: 'TIMEZONE',
    value: 'Asia/Kolkata',
    label: 'Platform Timezone',
    description: 'Timezone for all timestamps and scheduling',
    category: 'Localization & Defaults',
    type: 'STRING',
    isEditable: true,
  },

  // Pricing & Revenue
  {
    key: 'PLATFORM_COMMISSION_PERCENT',
    value: '5',
    label: 'Platform Commission (%)',
    description: 'Commission percentage on all vendor sales',
    category: 'Pricing & Revenue',
    type: 'NUMBER',
    isEditable: true,
  },
  {
    key: 'TAX_RATE_PERCENT',
    value: '18',
    label: 'Default Tax Rate (%)',
    description: 'GST tax rate applied to all orders',
    category: 'Pricing & Revenue',
    type: 'NUMBER',
    isEditable: true,
  },
  {
    key: 'SHIPPING_COST_BASE_CENTS',
    value: '5000',
    label: 'Base Shipping Cost',
    description: 'Base shipping cost in cents (50.00 if INR)',
    category: 'Pricing & Revenue',
    type: 'NUMBER',
    isEditable: true,
  },
  {
    key: 'FREE_SHIPPING_THRESHOLD_CENTS',
    value: '50000',
    label: 'Free Shipping Threshold',
    description: 'Order amount (in cents) for free shipping',
    category: 'Pricing & Revenue',
    type: 'NUMBER',
    isEditable: true,
  },

  // Automation & Operations
  {
    key: 'AUTO_APPROVE_VENDORS',
    value: 'false',
    label: 'Auto-Approve Vendors',
    description: 'Automatically approve vendors on registration',
    category: 'Automation & Operations',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'AUTO_PROCESS_REFUNDS',
    value: 'true',
    label: 'Auto-Process Refunds',
    description: 'Automatically process refund requests',
    category: 'Automation & Operations',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'ORDER_CONFIRMATION_DELAY_MINUTES',
    value: '5',
    label: 'Order Confirmation Delay (Minutes)',
    description: 'Minutes to wait before confirming order',
    category: 'Automation & Operations',
    type: 'NUMBER',
    isEditable: true,
  },
  {
    key: 'INVENTORY_LOW_STOCK_THRESHOLD',
    value: '20',
    label: 'Low Stock Alert Threshold',
    description: 'Quantity threshold for low stock warnings',
    category: 'Automation & Operations',
    type: 'NUMBER',
    isEditable: true,
  },

  // Security & Compliance
  {
    key: 'REQUIRE_KYC_FOR_VENDORS',
    value: 'true',
    label: 'Require KYC for Vendors',
    description: 'Mandate KYC verification for vendor onboarding',
    category: 'Security & Compliance',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'REQUIRE_DRUG_LICENSE',
    value: 'true',
    label: 'Require Drug License',
    description: 'Mandate drug license for vendor registration',
    category: 'Security & Compliance',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'SESSION_TIMEOUT_MINUTES',
    value: '30',
    label: 'Session Timeout (Minutes)',
    description: 'Minutes of inactivity before session expires',
    category: 'Security & Compliance',
    type: 'NUMBER',
    isEditable: true,
  },
  {
    key: 'MAX_LOGIN_ATTEMPTS',
    value: '5',
    label: 'Max Login Attempts',
    description: 'Maximum failed login attempts before account lock',
    category: 'Security & Compliance',
    type: 'NUMBER',
    isEditable: true,
  },

  // Notifications & Communication
  {
    key: 'ENABLE_EMAIL_NOTIFICATIONS',
    value: 'true',
    label: 'Enable Email Notifications',
    description: 'Send email notifications to users',
    category: 'Notifications & Communication',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'ENABLE_SMS_NOTIFICATIONS',
    value: 'false',
    label: 'Enable SMS Notifications',
    description: 'Send SMS notifications to users',
    category: 'Notifications & Communication',
    type: 'BOOLEAN',
    isEditable: true,
  },
  {
    key: 'ORDER_NOTIFICATION_DELAY_SECONDS',
    value: '2',
    label: 'Order Notification Delay (Seconds)',
    description: 'Seconds to delay order notifications',
    category: 'Notifications & Communication',
    type: 'NUMBER',
    isEditable: true,
  },
];

module.exports = {
  seedSystemSettings: async () => {
    try {
      for (const setting of DEFAULT_SETTINGS) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {}, // Don't override existing values
          create: setting,
        });
      }
      console.log('✅ System settings seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding system settings:', error);
      throw error;
    }
  },

  // Initialize settings on first app load if table is empty
  initializeSettings: async () => {
    try {
      const count = await prisma.systemSetting.count();
      if (count === 0) {
        await module.exports.seedSystemSettings();
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  },
};
