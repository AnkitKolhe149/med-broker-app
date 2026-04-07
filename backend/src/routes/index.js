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

const router = express.Router();

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
