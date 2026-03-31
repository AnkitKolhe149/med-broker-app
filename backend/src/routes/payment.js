const express = require("express");
const router = express.Router();
const { prisma } = require("../database/prisma");

// ✅ CREATE PAYMENT
router.post("/create", async (req, res) => {
  try {
    console.log("🔥 CREATE API HIT");

    const { amount, userId, orderId } = req.body;

    const paymentIntentId = "pay_" + Date.now();

    const payment = await prisma.payment.create({
      data: {
  userId: userId || "user123",
  orderId: orderId || "order_" + Date.now(),
  amount: Number(amount) || 100,
  currency: "INR",
  status: "PENDING",
  paymentIntentId,
  provider: "CUSTOM" // ✅ FIXED
},
    });

    console.log("✅ CREATED:", paymentIntentId);

    res.json({
      success: true,
      paymentIntentId,
    });

  } catch (error) {
    console.error("❌ CREATE ERROR:", error);
    res.status(500).json({ success: false });
  }
});


// ✅ UPDATE PAYMENT STATUS
router.post("/success", async (req, res) => {
  try {
    console.log("🔥 SUCCESS API HIT");

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      console.log("❌ Missing paymentIntentId");
      return res.status(400).json({ error: "Missing paymentIntentId" });
    }

    await prisma.payment.updateMany({
      where: { paymentIntentId },
      data: { status: "SUCCESS" }, // ✅ ENUM FIX
    });

    console.log("✅ UPDATED:", paymentIntentId);

    res.json({ success: true });

  } catch (error) {
    console.error("❌ SUCCESS ERROR:", error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;