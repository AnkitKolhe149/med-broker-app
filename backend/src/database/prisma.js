const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const prismaLogLevel = process.env.PRISMA_LOG_LEVEL || 'warn';
const prismaLogConfig = prismaLogLevel === 'query'
  ? ['query', 'error', 'warn']
  : ['error', 'warn'];
const OPERATION_RETRY_ATTEMPTS = Number(process.env.PRISMA_OPERATION_RETRY_ATTEMPTS || 3);

// PrismaPg requires a pg Pool instance.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 10000),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
  keepAlive: true,
});

const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({
  adapter,
  log: prismaLogConfig,
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDbTerminationError = (error) => {
  if (!error) return false;

  const message = [
    error.message,
    error?.cause?.message,
    error?.meta?.cause,
    error?.meta?.message,
  ].filter(Boolean).join(' ').toLowerCase();
  const code = String(error.code || '').toUpperCase();
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EPIPE' ||
    message.includes('57p01') ||
    message.includes('administrator command') ||
    message.includes('terminating connection due to administrator command') ||
    message.includes('server closed the connection unexpectedly') ||
    message.includes('closed, cause: none') ||
    message.includes('econnreset') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('socket hang up') ||
    message.includes('read etimedout')
  );
};

const executeWithTransientRetry = async (query, args) => {
  let lastError = null;

  for (let attempt = 1; attempt <= OPERATION_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await query(args);
    } catch (error) {
      lastError = error;
      if (!isTransientDbTerminationError(error)) {
        throw error;
      }

      const recovered = await reconnectWithRetry();
      if (!recovered || attempt === OPERATION_RETRY_ATTEMPTS) {
        break;
      }

      await wait(attempt * 250);
    }
  }

  throw lastError;
};

// Test connection with retry logic
const connectWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await basePrisma.$connect();
      console.log('✓ Database connected successfully');
      return;
    } catch (err) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('✗ Unable to connect to database after multiple attempts');
      } else {
        console.log(`  Retrying in ${(i + 1) * 2} seconds...`);
        await wait((i + 1) * 2000);
      }
    }
  }
};

const reconnectWithRetry = async (retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      await basePrisma.$disconnect().catch(() => {});
      await basePrisma.$connect();
      return true;
    } catch (error) {
      if (i === retries - 1) {
        return false;
      }
      await wait((i + 1) * 300);
    }
  }

  return false;
};

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        return executeWithTransientRetry(query, args);
      },
    },
    async $queryRaw({ args, query }) {
      return executeWithTransientRetry(query, args);
    },
    async $executeRaw({ args, query }) {
      return executeWithTransientRetry(query, args);
    }
  },
});

connectWithRetry();

// Graceful shutdown
process.on('beforeExit', async () => {
  await basePrisma.$disconnect();
  await pool.end().catch(() => {});
});

process.on('SIGINT', async () => {
  await basePrisma.$disconnect();
  await pool.end().catch(() => {});
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await basePrisma.$disconnect();
  await pool.end().catch(() => {});
  process.exit(0);
});

module.exports = { prisma };
