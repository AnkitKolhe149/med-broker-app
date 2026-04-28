const express = require("express");
const { prisma } = require("../database/prisma");
const authRoutes = require("../modules/auth/auth.routes");
const onboardingRoutes = require("../modules/onboarding/onboarding.routes");
const exchangeRateRoutes = require("../modules/exchangeRate/exchangeRate.routes");
const inventoryRoutes = require("../modules/inventory/inventory.routes");
const medicinesRoutes = require("../modules/medicines/medicines.routes");
const orderRoutes = require("../modules/orders/orders.routes");
const paymentRoutes = require("../modules/payments/payments.routes");
const aiRoutes = require("../modules/ai/ai.routes");
const vendorInsightsRoutes = require("../modules/vendorInsights/vendorInsights.routes");
const vendorProfileRoutes = require("../modules/vendorProfile/vendorProfile.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const wishlistRoutes = require("../modules/wishlist/wishlist.routes");
const adminRoutes = require("../modules/admin/admin.routes");

const router = express.Router();

const DEFAULT_PRICING_CONFIG = {
  standardDeliveryChargeCents: 0,
  expressDeliveryChargeCents: 900,
  freeDeliveryThresholdCents: 50000,
  taxRatePercent: 5
};

const loadPricingConfig = async () => {
  const keys = [
    'STANDARD_DELIVERY_CHARGE_CENTS',
    'EXPRESS_DELIVERY_CHARGE_CENTS',
    'FREE_DELIVERY_THRESHOLD_CENTS',
    'TAX_RATE_PERCENT'
  ];

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true }
  }).catch(() => []);

  const pricingConfig = { ...DEFAULT_PRICING_CONFIG };

  for (const setting of settings) {
    const value = Number(setting.value);
    if (!Number.isFinite(value)) continue;

    if (setting.key === 'STANDARD_DELIVERY_CHARGE_CENTS') pricingConfig.standardDeliveryChargeCents = value;
    if (setting.key === 'EXPRESS_DELIVERY_CHARGE_CENTS') pricingConfig.expressDeliveryChargeCents = value;
    if (setting.key === 'FREE_DELIVERY_THRESHOLD_CENTS') pricingConfig.freeDeliveryThresholdCents = value;
    if (setting.key === 'TAX_RATE_PERCENT') pricingConfig.taxRatePercent = value;
  }

  return pricingConfig;
};

router.get('/config/pricing', async (_req, res, next) => {
  try {
    const pricingConfig = await loadPricingConfig();
    res.json({ success: true, data: pricingConfig });
  } catch (error) {
    next(error);
  }
});

// Auth routes
router.use("/auth", authRoutes);

// Onboarding routes
router.use("/onboarding", onboardingRoutes);

// Exchange rate routes
router.use("/exchange-rates", exchangeRateRoutes);

// Vendor inventory routes
router.use("/inventory", inventoryRoutes);

// Medicines catalog routes
router.use("/medicines", medicinesRoutes);

// Order routes
router.use("/orders", orderRoutes);

// Payment routes
router.use("/payments", paymentRoutes);

// AI chatbot routes
router.use("/ai", aiRoutes);

// Vendor dashboard/analytics routes
router.use("/vendor-insights", vendorInsightsRoutes);

// Vendor profile settings routes
router.use("/vendor", vendorProfileRoutes);

router.use('/addresses', require('../modules/address/address.routes'));
router.use('/shipments', require('../modules/shipments/shipments.routes'));
router.use('/inventory-batches', require('../modules/inventoryBatch/inventoryBatch.routes'));
router.use('/notification-preferences', require('../modules/notificationPreference/notificationPreference.routes'));
router.use('/reviews', require('../modules/reviews/reviews.routes'));

// Customer cart & wishlist
router.use('/cart', cartRoutes);
router.use('/favorites', wishlistRoutes);

// Admin dashboard and management routes
router.use("/admin", adminRoutes);

// Legacy user routes (keep for now, can be removed later)
router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role
      }
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
