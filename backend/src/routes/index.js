const express = require("express");
const { prisma } = require("../database/prisma");
const authRoutes = require("../modules/auth/auth.routes");
const onboardingRoutes = require("../modules/onboarding/onboarding.routes");

const router = express.Router();

// Auth routes
router.use("/auth", authRoutes);

// Onboarding routes
router.use("/onboarding", onboardingRoutes);

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
