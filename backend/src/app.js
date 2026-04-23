const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { prisma } = require("./database/prisma");

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

const HEALTH_DB_PROBE_TTL_MS = 15 * 1000;
let cachedDbProbe = {
  checkedAt: 0,
  status: 'disconnected',
  latency: null
};

const probeDatabaseHealth = async () => {
  const now = Date.now();
  if (now - cachedDbProbe.checkedAt < HEALTH_DB_PROBE_TTL_MS) {
    return cachedDbProbe;
  }

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    cachedDbProbe = {
      checkedAt: now,
      status: 'connected',
      latency: `${Date.now() - start}ms`
    };
  } catch (_error) {
    cachedDbProbe = {
      checkedAt: now,
      status: 'error',
      latency: null
    };
  }

  return cachedDbProbe;
};

// Enhanced health check with database status
app.get("/health", async (req, res) => {
  const dbProbe = await probeDatabaseHealth();
  
  res.json({ 
    status: "ok",
    database: dbProbe.status,
    latency: dbProbe.latency,
    timestamp: new Date().toISOString()
  });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
