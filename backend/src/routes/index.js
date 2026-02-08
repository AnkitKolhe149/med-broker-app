const express = require("express");
const { prisma } = require("../database/prisma");

const router = express.Router();

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
