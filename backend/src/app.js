const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { prisma } = require("./database/prisma");

const app = express();

// Configure trust proxy for deployments behind reverse proxies/load-balancers.
// Set TRUST_PROXY=true in environment when running behind a proxy (NGINX, cloud LB).
const trustProxyEnv = String(process.env.TRUST_PROXY || '').trim();
if (trustProxyEnv) {
  // Allow specifying a value for `trust proxy`. If set to 'true', use 'loopback'
  // to avoid permissive configuration that express-rate-limit warns about.
  const trustValue = trustProxyEnv.toLowerCase() === 'true' ? 'loopback' : trustProxyEnv;
  app.set('trust proxy', trustValue);
  console.info('Express trust proxy set to:', trustValue);
}

// Enable CORS for frontend.
// Priority: CORS_ORIGIN (comma-separated) -> FRONTEND_URL -> built-in deployed frontend -> local development defaults.
// Supports wildcard entries in CORS_ORIGIN such as https://mediq-*.vercel.app
const defaultOrigins = [
  'https://mediq-weld.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080'
];
const stripWrappingQuotes = (value) => String(value || '').replace(/^['\"]|['\"]$/g, '');
const normalizeOriginValue = (value) => {
  const normalized = stripWrappingQuotes(value).trim();
  if (!normalized) {
    return '';
  }

  try {
    return new URL(normalized).origin;
  } catch (_error) {
    return normalized.replace(/\/$/, '');
  }
};

const configuredOrigins = String(process.env.CORS_ORIGIN || '')
  .split(/[\s,;]+/)
  .map((origin) => normalizeOriginValue(origin))
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  configuredOrigins.push(normalizeOriginValue(process.env.FRONTEND_URL));
}

const hasExplicitOrigins = configuredOrigins.length > 0;
const allowedOrigins = [...new Set([...(configuredOrigins.length ? configuredOrigins : []), ...defaultOrigins])];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wildcardToRegex = (pattern) => {
  const normalized = pattern.trim();
  if (!normalized.includes('*')) {
    return null;
  }

  const regexSource = `^${normalized.split('*').map(escapeRegExp).join('.*')}$`;
  return new RegExp(regexSource);
};

const allowedOriginRegexes = configuredOrigins
  .map(wildcardToRegex)
  .filter(Boolean);

console.info('CORS allowlist initialized:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    //Allow server-to-server requests and same-origin requests without Origin header
    if (!origin) {
      return callback(null, true);
    }

    //If no explicit origins are configured, allow all origins to avoid hard failures.
    if (!hasExplicitOrigins) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (allowedOriginRegexes.some((regex) => regex.test(origin))) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin, '| allowed:', allowedOrigins.join(', '));
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

//Root probe for platforms that default to '/'
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
