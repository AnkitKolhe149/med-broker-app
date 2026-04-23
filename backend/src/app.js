const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { prisma } = require("./database/prisma");

const app = express();

// Enable CORS for frontend.
// Priority: CORS_ORIGIN (comma-separated) -> FRONTEND_URL -> local development defaults.
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];
const configuredOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  configuredOrigins.push(process.env.FRONTEND_URL.trim());
}

const allowedOrigins = [...new Set([...(configuredOrigins.length ? configuredOrigins : []), ...defaultOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests and same-origin requests without Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
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

// Root probe for platforms that default to '/'
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
